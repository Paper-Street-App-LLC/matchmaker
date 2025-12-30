import { HTTPException } from 'hono/http-exception'
import type { MiddlewareHandler } from 'hono'
import type { SupabaseClient } from '../lib/supabase'

type Variables = {
	userId: string
}

export let createAuthMiddleware = (
	supabaseClient: SupabaseClient
): MiddlewareHandler<{ Variables: Variables }> => {
	return async (c, next) => {
		let authHeader = c.req.header('Authorization')

		if (!authHeader) {
			throw new HTTPException(401, { message: 'Unauthorized' })
		}

		let token = authHeader.replace('Bearer ', '')

		if (token === authHeader) {
			// Bearer prefix was not found
			throw new HTTPException(401, { message: 'Unauthorized' })
		}

		let { data, error } = await supabaseClient.auth.getUser(token)

		if (error || !data.user) {
			throw new HTTPException(401, { message: 'Unauthorized' })
		}

		c.set('userId', data.user.id)

		await next()
	}
}
