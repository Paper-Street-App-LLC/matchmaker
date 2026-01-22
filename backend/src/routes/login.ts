import { Hono } from 'hono'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

let oauthParamsSchema = z.object({
	client_id: z.string().min(1),
	redirect_uri: z.string().url(),
	response_type: z.literal('code'),
	state: z.string().min(1),
	code_challenge: z.string().min(43),
	code_challenge_method: z.literal('S256'),
})

let loginFormSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
	mode: z.enum(['signin', 'signup']),
	client_id: z.string().min(1),
	redirect_uri: z.string().url(),
	response_type: z.literal('code'),
	state: z.string().min(1),
	code_challenge: z.string().min(43),
	code_challenge_method: z.literal('S256'),
})

function generateAuthorizationCode(): string {
	let array = new Uint8Array(32)
	crypto.getRandomValues(array)
	return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

function renderLoginPage(params: {
	client_id: string
	redirect_uri: string
	response_type: string
	state: string
	code_challenge: string
	code_challenge_method: string
	error?: string
	mode?: 'signin' | 'signup'
}): string {
	let { error, mode = 'signin' } = params

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Sign In - Matchmaker</title>
	<style>
		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 1rem;
		}
		.card {
			background: white;
			border-radius: 12px;
			padding: 2rem;
			width: 100%;
			max-width: 400px;
			box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		}
		h1 {
			text-align: center;
			margin-bottom: 0.5rem;
			color: #1a1a2e;
			font-size: 1.5rem;
		}
		.subtitle {
			text-align: center;
			color: #666;
			margin-bottom: 1.5rem;
			font-size: 0.875rem;
		}
		.form-group {
			margin-bottom: 1rem;
		}
		label {
			display: block;
			margin-bottom: 0.5rem;
			color: #333;
			font-weight: 500;
			font-size: 0.875rem;
		}
		input[type="email"],
		input[type="password"] {
			width: 100%;
			padding: 0.75rem;
			border: 1px solid #ddd;
			border-radius: 8px;
			font-size: 1rem;
			transition: border-color 0.2s;
		}
		input[type="email"]:focus,
		input[type="password"]:focus {
			outline: none;
			border-color: #667eea;
		}
		.error {
			background: #fee2e2;
			color: #dc2626;
			padding: 0.75rem;
			border-radius: 8px;
			margin-bottom: 1rem;
			font-size: 0.875rem;
		}
		button[type="submit"] {
			width: 100%;
			padding: 0.75rem;
			background: #667eea;
			color: white;
			border: none;
			border-radius: 8px;
			font-size: 1rem;
			font-weight: 600;
			cursor: pointer;
			transition: background 0.2s;
		}
		button[type="submit"]:hover {
			background: #5a67d8;
		}
		.toggle {
			text-align: center;
			margin-top: 1rem;
			font-size: 0.875rem;
			color: #666;
		}
		.toggle button {
			background: none;
			border: none;
			color: #667eea;
			cursor: pointer;
			font-weight: 600;
			font-size: 0.875rem;
		}
		.toggle button:hover {
			text-decoration: underline;
		}
	</style>
</head>
<body>
	<div class="card">
		<h1 id="form-title">${mode === 'signin' ? 'Sign In' : 'Create Account'}</h1>
		<p class="subtitle">Connect to Matchmaker</p>

		${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}

		<form method="POST" action="/login">
			<input type="hidden" name="client_id" value="${escapeHtml(params.client_id)}">
			<input type="hidden" name="redirect_uri" value="${escapeHtml(params.redirect_uri)}">
			<input type="hidden" name="response_type" value="${escapeHtml(params.response_type)}">
			<input type="hidden" name="state" value="${escapeHtml(params.state)}">
			<input type="hidden" name="code_challenge" value="${escapeHtml(params.code_challenge)}">
			<input type="hidden" name="code_challenge_method" value="${escapeHtml(params.code_challenge_method)}">
			<input type="hidden" name="mode" id="mode-input" value="${mode}">

			<div class="form-group">
				<label for="email">Email</label>
				<input type="email" id="email" name="email" required autocomplete="email">
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input type="password" id="password" name="password" required minlength="6" autocomplete="current-password">
			</div>

			<button type="submit" id="submit-btn">${mode === 'signin' ? 'Sign In' : 'Create Account'}</button>
		</form>

		<div class="toggle">
			<span id="toggle-text">${mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}</span>
			<button type="button" id="toggle-btn" onclick="toggleMode()">${mode === 'signin' ? 'Create Account' : 'Sign In'}</button>
		</div>
	</div>

	<script>
		function toggleMode() {
			let modeInput = document.getElementById('mode-input');
			let title = document.getElementById('form-title');
			let submitBtn = document.getElementById('submit-btn');
			let toggleText = document.getElementById('toggle-text');
			let toggleBtn = document.getElementById('toggle-btn');

			if (modeInput.value === 'signin') {
				modeInput.value = 'signup';
				title.textContent = 'Create Account';
				submitBtn.textContent = 'Create Account';
				toggleText.textContent = 'Already have an account?';
				toggleBtn.textContent = 'Sign In';
			} else {
				modeInput.value = 'signin';
				title.textContent = 'Sign In';
				submitBtn.textContent = 'Sign In';
				toggleText.textContent = "Don't have an account?";
				toggleBtn.textContent = 'Create Account';
			}
		}
	</script>
</body>
</html>`
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
}

export let createLoginRoutes = (supabaseClient: SupabaseClient): Hono => {
	let app = new Hono()

	// GET /login - Display login page
	app.get('/', async c => {
		let query = c.req.query()

		let parseResult = oauthParamsSchema.safeParse(query)
		if (!parseResult.success) {
			return c.text('Invalid OAuth parameters', 400)
		}

		let params = parseResult.data
		let html = renderLoginPage({
			...params,
			mode: 'signin',
		})

		return c.html(html)
	})

	// POST /login - Handle sign in/sign up
	app.post('/', async c => {
		let body = await c.req.parseBody()

		let parseResult = loginFormSchema.safeParse(body)
		if (!parseResult.success) {
			return c.html(
				renderLoginPage({
					client_id: String(body.client_id || ''),
					redirect_uri: String(body.redirect_uri || ''),
					response_type: 'code',
					state: String(body.state || ''),
					code_challenge: String(body.code_challenge || ''),
					code_challenge_method: 'S256',
					error: 'Invalid form data',
				})
			)
		}

		let {
			email,
			password,
			mode,
			client_id,
			redirect_uri,
			state,
			code_challenge,
			code_challenge_method,
		} = parseResult.data

		let authResult
		if (mode === 'signin') {
			authResult = await supabaseClient.auth.signInWithPassword({
				email,
				password,
			})
		} else {
			authResult = await supabaseClient.auth.signUp({
				email,
				password,
			})
		}

		if (authResult.error) {
			return c.html(
				renderLoginPage({
					client_id,
					redirect_uri,
					response_type: 'code',
					state,
					code_challenge,
					code_challenge_method,
					error: authResult.error.message,
					mode,
				})
			)
		}

		// Generate authorization code
		// In a production system, this code would be stored with the PKCE challenge
		// and exchanged for tokens via the /oauth/token endpoint
		let authorizationCode = generateAuthorizationCode()

		// Build redirect URL with authorization code
		let redirectUrl = new URL(redirect_uri)
		redirectUrl.searchParams.set('code', authorizationCode)
		redirectUrl.searchParams.set('state', state)

		return c.redirect(redirectUrl.toString(), 302)
	})

	return app
}
