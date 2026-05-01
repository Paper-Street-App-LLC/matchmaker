export {
	DomainError,
	createPerson,
	InvalidPersonError,
	createIntroduction,
	InvalidIntroductionError,
	createMatchDecision,
	InvalidMatchDecisionError,
	createPreferences,
	InvalidPreferencesError,
	AuthorizationService,
	AuthorizationError,
	RepositoryError,
	PersonNotFoundError,
	IntroductionNotFoundError,
	MatchDecisionNotFoundError,
	RepositoryConflictError,
} from '@matchmaker/shared'

export type {
	Person,
	PersonInput,
	Introduction,
	IntroductionInput,
	IntroductionStatus,
	MatchDecision,
	MatchDecisionInput,
	Decision,
	Preferences,
	PreferencesInput,
	IPersonRepository,
	PersonUpdate,
	IIntroductionRepository,
	IntroductionUpdate,
	IMatchDecisionRepository,
	IAuthContext,
} from '@matchmaker/shared'

export { processMessage } from './ai'
export type {
	ConversationStore,
	GenerateTextFn,
	ProcessMessageDeps,
	ProcessMessageInput,
} from './ai'
export { createMatchmakerTools } from './tools'
export {
	createMcpClient,
	signServiceJwt,
	formatToolResult,
	type McpToolCaller,
	type CreateMcpClientOptions,
} from './mcp-client'
