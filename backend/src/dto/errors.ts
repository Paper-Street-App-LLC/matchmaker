import type { UseCaseError } from '../usecases/index'

export type ErrorHttpStatus = 403 | 404 | 409 | 422

export type ErrorHttpResponse = {
	readonly status: ErrorHttpStatus
	readonly body: { readonly error: string }
}

export type UseCaseErrorMessageOverrides = Partial<
	Record<UseCaseError['code'], string>
>

let statusFor = (code: UseCaseError['code']): ErrorHttpStatus => {
	switch (code) {
		case 'not_found':
			return 404
		case 'forbidden':
			return 403
		case 'unprocessable':
			return 422
		case 'conflict':
			return 409
	}
}

export let useCaseErrorToHttp = (
	error: UseCaseError,
	overrides: UseCaseErrorMessageOverrides = {},
): ErrorHttpResponse => ({
	status: statusFor(error.code),
	body: { error: overrides[error.code] ?? error.message },
})
