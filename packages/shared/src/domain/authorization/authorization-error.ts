import { DomainError } from '../errors.js'

export class AuthorizationError extends DomainError {
	constructor(code: string, message: string) {
		super(code, message)
		this.name = 'AuthorizationError'
	}
}
