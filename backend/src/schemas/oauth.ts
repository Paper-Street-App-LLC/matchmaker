import { z } from 'zod'

export let authorizeQuerySchema = z.object({
	client_id: z.string().min(1, 'client_id is required'),
	redirect_uri: z.string().url('redirect_uri must be a valid URL'),
	response_type: z.literal('code', {
		errorMap: () => ({ message: "response_type must be 'code'" }),
	}),
	state: z.string().min(1, 'state is required'),
	code_challenge: z.string().min(43, 'code_challenge must be at least 43 characters'),
	code_challenge_method: z.literal('S256', {
		errorMap: () => ({ message: "code_challenge_method must be 'S256'" }),
	}),
})

export type AuthorizeQuery = z.infer<typeof authorizeQuerySchema>

// Token endpoint schemas
export let authorizationCodeGrantSchema = z.object({
	grant_type: z.literal('authorization_code'),
	code: z.string().min(1, 'code is required'),
	redirect_uri: z.string().url('redirect_uri must be a valid URL'),
	client_id: z.string().min(1, 'client_id is required'),
	code_verifier: z.string().min(43, 'code_verifier must be at least 43 characters'),
})

export let refreshTokenGrantSchema = z.object({
	grant_type: z.literal('refresh_token'),
	refresh_token: z.string().min(1, 'refresh_token is required'),
})

export let tokenRequestSchema = z.discriminatedUnion('grant_type', [
	authorizationCodeGrantSchema,
	refreshTokenGrantSchema,
])

export type TokenRequest = z.infer<typeof tokenRequestSchema>
