/** Lightweight current-user identity abstraction — no framework auth types leak into the domain. */
export interface IAuthContext {
	readonly userId: string
}
