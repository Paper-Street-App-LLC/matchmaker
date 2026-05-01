import { evalite } from 'evalite'
import type { McpToolCaller } from '../src/core/mcp-client'
import { processMessage } from '../src/core/ai'
import { createMatchmakerTools } from '../src/core/tools'
import type { InboundMessage } from '../src/types/messages'
import type { ConversationMessage } from '../src/store/conversations'
import { makeInbound } from './fixtures/inbound'
import { emptyHistory, historyWithName, makeStaticStore } from './fixtures/histories'
import { mentions, doesNotMention, nonEmpty, type CoreOutput } from './scorers/mentions'
import { toolCalled } from './scorers/tool-called'

let runEvalite = process.env.RUN_EVALS === '1' ? evalite : evalite.experimental_skip

type Scenario = {
	inbound: InboundMessage
	history: ConversationMessage[]
	toolResponses?: Record<string, string>
}

function makeRecordingCaller(toolResponses: Record<string, string> = {}): {
	caller: McpToolCaller
	toolCalls: string[]
} {
	let toolCalls: string[] = []
	let caller: McpToolCaller = {
		async call(name, _args) {
			toolCalls.push(name)
			return toolResponses[name] ?? '[]'
		},
	}
	return { caller, toolCalls }
}

async function runScenario(scenario: Scenario): Promise<CoreOutput> {
	let { caller, toolCalls } = makeRecordingCaller(scenario.toolResponses)
	let store = makeStaticStore(scenario.history)
	let tools = createMatchmakerTools(caller)

	let text = await processMessage(
		{ inbound: scenario.inbound },
		{ store, tools },
	)

	return { text, toolCalls }
}

runEvalite<Scenario, CoreOutput, CoreOutput>('AI core: simple reply', {
	data: () => [
		{
			input: {
				inbound: makeInbound({ text: "Hi, I'm looking for a match" }),
				history: emptyHistory(),
			},
		},
	],
	task: runScenario,
	scorers: [nonEmpty],
})

runEvalite<Scenario, CoreOutput, CoreOutput>('AI core: history recall', {
	data: () => {
		let threadId = 'eval-history-recall'
		return [
			{
				input: {
					inbound: makeInbound({ threadId, text: 'What did I say earlier?' }),
					history: historyWithName(threadId, 'Alex'),
				},
			},
		]
	},
	task: runScenario,
	scorers: [nonEmpty, mentions('Alex')],
})

runEvalite<Scenario, CoreOutput, CoreOutput>('AI core: tool execution', {
	data: () => [
		{
			input: {
				inbound: makeInbound({ text: 'List all the people I have so far' }),
				history: emptyHistory(),
				toolResponses: {
					list_people: JSON.stringify([{ id: 'p1', name: 'Alex' }]),
				},
			},
		},
	],
	task: runScenario,
	scorers: [nonEmpty, toolCalled('list_people')],
})

runEvalite<Scenario, CoreOutput, CoreOutput>('AI core: transport-agnostic', {
	data: () => [
		{
			input: {
				inbound: makeInbound({ provider: 'telegram', text: 'Help me start matchmaking' }),
				history: emptyHistory(),
			},
		},
		{
			input: {
				inbound: makeInbound({ provider: 'whatsapp', text: 'Help me start matchmaking' }),
				history: emptyHistory(),
			},
		},
	],
	task: runScenario,
	scorers: [nonEmpty, doesNotMention('telegram'), doesNotMention('whatsapp')],
})
