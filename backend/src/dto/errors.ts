import type { UseCaseError } from '../usecases/index'

export type ErrorHttpStatus = 403 | 404 | 409 | 422

export type ErrorHttpResponse = {
	readonly status: ErrorHttpStatus
	readonly body: { readonly error: string }
}

export let useCaseErrorToHttp = (error: UseCaseError): ErrorHttpResponse => {
	switch (error.code) {
		case 'not_found':
			return { status: 404, body: { error: error.message } }
		case 'forbidden':
			return { status: 403, body: { error: error.message } }
		case 'unprocessable':
			return { status: 422, body: { error: error.message } }
		case 'conflict':
			return { status: 409, body: { error: error.message } }
	}
}
