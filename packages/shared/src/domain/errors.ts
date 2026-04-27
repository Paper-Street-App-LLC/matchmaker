export class DomainError extends Error {
	readonly code: string

	constructor(code: string, message: string) {
		super(message)
		this.name = 'DomainError'
		this.code = code
		Object.setPrototypeOf(this, new.target.prototype)
	}
}
