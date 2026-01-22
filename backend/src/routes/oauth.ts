import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import type { SupabaseClient } from '@supabase/supabase-js'
import { authorizeQuerySchema } from '../schemas/oauth'
import { getAndRemoveAuthorizationCode, verifyCodeChallenge } from '../lib/authCodeStore'

// OAuth 2.0 error response helper
function oauthError(c: any, error: string, description?: string, status = 400) {
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
		let grantType = body.grant_type as string | undefined

		// Validate grant_type
		if (!grantType) {
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

async function handleAuthorizationCodeGrant(c: any, body: Record<string, any>) {
	let code = body.code as string | undefined
	let redirectUri = body.redirect_uri as string | undefined
	let clientId = body.client_id as string | undefined
	let codeVerifier = body.code_verifier as string | undefined

	// Validate required parameters
	if (!code) {
		return oauthError(c, 'invalid_request', 'code is required')
	}
	if (!redirectUri) {
		return oauthError(c, 'invalid_request', 'redirect_uri is required')
	}
	if (!clientId) {
		return oauthError(c, 'invalid_request', 'client_id is required')
	}
	if (!codeVerifier) {
		return oauthError(c, 'invalid_request', 'code_verifier is required')
	}

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
	c: any,
	body: Record<string, any>,
	supabaseClient?: SupabaseClient
) {
	let refreshToken = body.refresh_token as string | undefined

	if (!refreshToken) {
		return oauthError(c, 'invalid_request', 'refresh_token is required')
	}

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
