import { Hono } from 'hono'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { zValidator } from '@hono/zod-validator'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
	authorizeQuerySchema,
	authorizationCodeGrantSchema,
	refreshTokenGrantSchema,
} from '../schemas/oauth'
import { getAndRemoveAuthorizationCode, verifyCodeChallenge } from '../lib/authCodeStore'

// Runtime type guard for checking if a value is a non-empty string
function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0
}

// OAuth 2.0 error response helper
function oauthError(c: Context, error: string, description?: string, status: ContentfulStatusCode = 400) {
	return c.json(
		{
			error,
			...(description && { error_description: description }),
		},
		status
	)
}

// Access token lifetime: 1 year in seconds
let ACCESS_TOKEN_EXPIRES_IN = 31536000

export let createOAuthRoutes = (supabaseClient?: SupabaseClient): Hono => {
	let app = new Hono()

	app.get('/authorize', zValidator('query', authorizeQuerySchema), async c => {
		let params = c.req.valid('query')

		// Build login URL with all OAuth parameters preserved
		let loginParams = new URLSearchParams({
			client_id: params.client_id,
			redirect_uri: params.redirect_uri,
			response_type: params.response_type,
			state: params.state,
			code_challenge: params.code_challenge,
			code_challenge_method: params.code_challenge_method,
		})

		let loginUrl = `/login?${loginParams.toString()}`

		return c.redirect(loginUrl, 302)
	})

	app.post('/token', async c => {
		let body = await c.req.parseBody()
		let grantType = body.grant_type

		// Validate grant_type using type guard
		if (!isNonEmptyString(grantType)) {
			return oauthError(c, 'invalid_request', 'grant_type is required')
		}

		if (grantType === 'authorization_code') {
			return handleAuthorizationCodeGrant(c, body)
		} else if (grantType === 'refresh_token') {
			return handleRefreshTokenGrant(c, body, supabaseClient)
		} else {
			return oauthError(c, 'unsupported_grant_type', `grant_type '${grantType}' is not supported`)
		}
	})

	return app
}

async function handleAuthorizationCodeGrant(
	c: Context,
	body: Record<string, string | File>
) {
	// Validate request body using Zod schema
	let parseResult = authorizationCodeGrantSchema.safeParse(body)
	if (!parseResult.success) {
		let firstError = parseResult.error.errors[0]
		return oauthError(c, 'invalid_request', firstError?.message || 'Invalid request')
	}

	let { code, redirect_uri: redirectUri, client_id: clientId, code_verifier: codeVerifier } =
		parseResult.data

	// Retrieve and remove authorization code (single use)
	let codeData = getAndRemoveAuthorizationCode(code)
	if (!codeData) {
		return oauthError(c, 'invalid_grant', 'Authorization code is invalid or expired')
	}

	// Validate redirect_uri matches
	if (codeData.redirectUri !== redirectUri) {
		return oauthError(c, 'invalid_grant', 'redirect_uri does not match')
	}

	// Validate client_id matches
	if (codeData.clientId !== clientId) {
		return oauthError(c, 'invalid_grant', 'client_id does not match')
	}

	// Verify PKCE code_verifier
	let isValidVerifier = await verifyCodeChallenge(codeVerifier, codeData.codeChallenge)
	if (!isValidVerifier) {
		return oauthError(c, 'invalid_grant', 'code_verifier is invalid')
	}

	// Return OAuth-compliant token response
	return c.json({
		access_token: codeData.accessToken,
		token_type: 'Bearer',
		expires_in: ACCESS_TOKEN_EXPIRES_IN,
		refresh_token: codeData.refreshToken,
	})
}

async function handleRefreshTokenGrant(
	c: Context,
	body: Record<string, string | File>,
	supabaseClient?: SupabaseClient
) {
	// Validate request body using Zod schema
	let parseResult = refreshTokenGrantSchema.safeParse(body)
	if (!parseResult.success) {
		let firstError = parseResult.error.errors[0]
		return oauthError(c, 'invalid_request', firstError?.message || 'Invalid request')
	}

	let { refresh_token: refreshToken } = parseResult.data

	if (!supabaseClient) {
		return oauthError(c, 'server_error', 'Supabase client not configured', 500)
	}

	// Use Supabase to refresh the session
	let { data, error } = await supabaseClient.auth.refreshSession({
		refresh_token: refreshToken,
	})

	if (error || !data.session) {
		return oauthError(c, 'invalid_grant', 'Invalid refresh token')
	}

	// Return OAuth-compliant token response
	return c.json({
		access_token: data.session.access_token,
		token_type: 'Bearer',
		expires_in: ACCESS_TOKEN_EXPIRES_IN,
		refresh_token: data.session.refresh_token,
	})
}
