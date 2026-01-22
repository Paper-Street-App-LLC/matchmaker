// In-memory store for authorization codes
// In production, this would be backed by Redis or a database

type AuthorizationCodeData = {
	userId: string
	clientId: string
	redirectUri: string
	codeChallenge: string
	accessToken: string
	refreshToken: string
	createdAt: number
}

let authCodes = new Map<string, AuthorizationCodeData>()

// Authorization codes expire after 10 minutes (OAuth 2.0 spec recommends short lifetime)
let CODE_EXPIRY_MS = 10 * 60 * 1000

function generateAuthorizationCode(): string {
	let array = new Uint8Array(32)
	crypto.getRandomValues(array)
	return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function storeAuthorizationCode(data: Omit<AuthorizationCodeData, 'createdAt'>): string {
	let code = generateAuthorizationCode()
	authCodes.set(code, {
		...data,
		createdAt: Date.now(),
	})
	return code
}

export function getAndRemoveAuthorizationCode(code: string): AuthorizationCodeData | null {
	let data = authCodes.get(code)
	if (!data) {
		return null
	}

	// Remove the code immediately (single use)
	authCodes.delete(code)

	// Check if expired
	if (Date.now() - data.createdAt > CODE_EXPIRY_MS) {
		return null
	}

	return data
}

export function clearAllCodes(): void {
	authCodes.clear()
}

// Verify PKCE code_verifier against stored code_challenge (S256 method)
export async function verifyCodeChallenge(
	codeVerifier: string,
	codeChallenge: string
): Promise<boolean> {
	// S256: BASE64URL(SHA256(code_verifier)) === code_challenge
	let encoder = new TextEncoder()
	let data = encoder.encode(codeVerifier)
	let hashBuffer = await crypto.subtle.digest('SHA-256', data)
	let hashArray = new Uint8Array(hashBuffer)

	// Convert to base64url encoding
	let base64 = btoa(String.fromCharCode.apply(null, Array.from(hashArray)))
	let base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

	return base64url === codeChallenge
}
