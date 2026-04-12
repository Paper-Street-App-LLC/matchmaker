/**
 * Thrown by HandleInboundMessage when the adapter cannot parse the
 * raw webhook payload. The router maps this to HTTP 400. Any other
 * error (upstream outage, transient network failure) should propagate
 * untouched so the transport layer returns 500.
 */
export class InboundParseError extends Error {
	readonly cause: unknown

	constructor(message: string, cause: unknown) {
		super(message)
		this.name = 'InboundParseError'
		this.cause = cause
	}
}
