export type UseCaseErrorEntity = 'person' | 'introduction' | 'match_decision'

export type UseCaseError =
	| { code: 'not_found'; entity: UseCaseErrorEntity; message: string }
	| { code: 'forbidden'; message: string }
	| { code: 'unprocessable'; field?: string; message: string }
	| { code: 'conflict'; message: string }

export type UseCaseResult<T> =
	| { ok: true; data: T }
	| { ok: false; error: UseCaseError }

export interface UseCase<Input, Output> {
	execute(input: Input): Promise<UseCaseResult<Output>>
}

export interface Clock {
	now(): Date
}

export let systemClock: Clock = {
	now: () => new Date(),
}

export interface IdGenerator {
	newId(): string
}

export let uuidGenerator: IdGenerator = {
	newId: () => crypto.randomUUID(),
}
