import { DomainError } from './errors.js'

type DomainErrorCtor<E extends DomainError> = new (code: string, message: string) => E

export function requireNonEmptyString<E extends DomainError>(
	value: unknown,
	field: string,
	code: string,
	ErrorClass: DomainErrorCtor<E>,
): string {
	if (typeof value !== 'string' || value.trim().length === 0) {
		throw new ErrorClass(code, `${field} must be a non-empty string`)
	}
	return value.trim()
}

export function assertValidDate<E extends DomainError>(
	value: unknown,
	field: string,
	code: string,
	ErrorClass: DomainErrorCtor<E>,
): asserts value is Date {
	if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
		throw new ErrorClass(code, `${field} must be a valid Date`)
	}
}
