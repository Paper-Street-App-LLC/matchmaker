import { http, HttpResponse } from 'msw'

let BASE_URL = 'http://localhost:3000'

export let handlers = [
	// POST /api/people - Success
	http.post(`${BASE_URL}/api/people`, async ({ request }) => {
		let auth = request.headers.get('Authorization')
		if (auth !== 'Bearer valid-token') {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		let body = (await request.json()) as { name: string }
		return HttpResponse.json(
			{
				id: '550e8400-e29b-41d4-a716-446655440000',
				name: body.name,
				matchmaker_id: '123e4567-e89b-12d3-a456-426614174000',
				age: null,
				location: null,
				gender: null,
				preferences: null,
				personality: null,
				notes: null,
				active: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
			{ status: 201 }
		)
	}),

	// GET /api/people - Success
	http.get(`${BASE_URL}/api/people`, ({ request }) => {
		let auth = request.headers.get('Authorization')
		if (auth !== 'Bearer valid-token') {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		return HttpResponse.json([
			{
				id: '660e8400-e29b-41d4-a716-446655440001',
				name: 'Alice',
				matchmaker_id: '123e4567-e89b-12d3-a456-426614174000',
				age: null,
				location: null,
				gender: null,
				preferences: null,
				personality: null,
				notes: null,
				active: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
		])
	}),

	// GET /api/people/:id - Success
	http.get(`${BASE_URL}/api/people/:id`, ({ request, params }) => {
		let auth = request.headers.get('Authorization')
		if (auth !== 'Bearer valid-token') {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		let { id } = params
		if (id === 'not-found-id') {
			return HttpResponse.json({ error: 'Person not found' }, { status: 404 })
		}
		return HttpResponse.json({
			id: id,
			name: 'Alice',
			matchmaker_id: '123e4567-e89b-12d3-a456-426614174000',
			age: 28,
			location: 'New York',
			gender: 'female',
			preferences: { ageRange: [25, 35] },
			personality: { introvert: false },
			notes: 'Looking for someone creative',
			active: true,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		})
	}),

	// PUT /api/people/:id - Success
	http.put(`${BASE_URL}/api/people/:id`, async ({ request, params }) => {
		let auth = request.headers.get('Authorization')
		if (auth !== 'Bearer valid-token') {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		let { id } = params
		if (id === 'not-found-id') {
			return HttpResponse.json({ error: 'Person not found' }, { status: 404 })
		}
		let body = (await request.json()) as Record<string, unknown>
		return HttpResponse.json({
			id: id,
			name: body.name ?? 'Alice',
			matchmaker_id: '123e4567-e89b-12d3-a456-426614174000',
			age: body.age ?? 28,
			location: body.location ?? 'New York',
			gender: body.gender ?? 'female',
			preferences: body.preferences ?? { ageRange: [25, 35] },
			personality: body.personality ?? { introvert: false },
			notes: body.notes ?? 'Looking for someone creative',
			active: true,
			created_at: '2026-01-08T00:00:00.000Z',
			updated_at: new Date().toISOString(),
		})
	}),

	// POST /api/introductions - Success
	http.post(`${BASE_URL}/api/introductions`, async ({ request }) => {
		let auth = request.headers.get('Authorization')
		if (auth !== 'Bearer valid-token') {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		let body = (await request.json()) as {
			person_a_id: string
			person_b_id: string
			notes?: string
		}
		return HttpResponse.json(
			{
				id: '770e8400-e29b-41d4-a716-446655440000',
				matchmaker_a_id: '123e4567-e89b-12d3-a456-426614174000',
				matchmaker_b_id: '123e4567-e89b-12d3-a456-426614174000',
				person_a_id: body.person_a_id,
				person_b_id: body.person_b_id,
				status: 'pending',
				notes: body.notes ?? null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
			{ status: 201 }
		)
	}),

	// GET /api/introductions - Success
	http.get(`${BASE_URL}/api/introductions`, ({ request }) => {
		let auth = request.headers.get('Authorization')
		if (auth !== 'Bearer valid-token') {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		return HttpResponse.json([
			{
				id: '770e8400-e29b-41d4-a716-446655440000',
				matchmaker_a_id: '123e4567-e89b-12d3-a456-426614174000',
				matchmaker_b_id: '123e4567-e89b-12d3-a456-426614174000',
				person_a_id: '550e8400-e29b-41d4-a716-446655440001',
				person_b_id: '550e8400-e29b-41d4-a716-446655440002',
				status: 'pending',
				notes: 'Both enjoy hiking',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
			{
				id: '770e8400-e29b-41d4-a716-446655440001',
				matchmaker_a_id: '123e4567-e89b-12d3-a456-426614174000',
				matchmaker_b_id: '999e4567-e89b-12d3-a456-426614174099',
				person_a_id: '550e8400-e29b-41d4-a716-446655440003',
				person_b_id: '550e8400-e29b-41d4-a716-446655440004',
				status: 'accepted',
				notes: null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			},
		])
	}),

	// GET /api/introductions/:id - Success
	http.get(`${BASE_URL}/api/introductions/:id`, ({ request, params }) => {
		let auth = request.headers.get('Authorization')
		if (auth !== 'Bearer valid-token') {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		let { id } = params
		if (id === 'not-found-id') {
			return HttpResponse.json({ error: 'Introduction not found' }, { status: 404 })
		}
		return HttpResponse.json({
			id: id,
			matchmaker_a_id: '123e4567-e89b-12d3-a456-426614174000',
			matchmaker_b_id: '123e4567-e89b-12d3-a456-426614174000',
			person_a_id: '550e8400-e29b-41d4-a716-446655440001',
			person_b_id: '550e8400-e29b-41d4-a716-446655440002',
			status: 'pending',
			notes: 'Both enjoy hiking',
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		})
	}),

	// PUT /api/introductions/:id - Success
	http.put(`${BASE_URL}/api/introductions/:id`, async ({ request, params }) => {
		let auth = request.headers.get('Authorization')
		if (auth !== 'Bearer valid-token') {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		let { id } = params
		if (id === 'not-found-id') {
			return HttpResponse.json({ error: 'Introduction not found' }, { status: 404 })
		}
		let body = (await request.json()) as Record<string, unknown>
		return HttpResponse.json({
			id: id,
			matchmaker_a_id: '123e4567-e89b-12d3-a456-426614174000',
			matchmaker_b_id: '123e4567-e89b-12d3-a456-426614174000',
			person_a_id: '550e8400-e29b-41d4-a716-446655440001',
			person_b_id: '550e8400-e29b-41d4-a716-446655440002',
			status: body.status ?? 'pending',
			notes: body.notes ?? 'Both enjoy hiking',
			created_at: '2026-01-08T00:00:00.000Z',
			updated_at: new Date().toISOString(),
		})
	}),

	// GET /api/matches/:personId - Success
	http.get(`${BASE_URL}/api/matches/:personId`, ({ request, params }) => {
		let auth = request.headers.get('Authorization')
		if (auth !== 'Bearer valid-token') {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		let { personId } = params
		if (personId === 'not-found-id') {
			return HttpResponse.json({ error: 'Person not found' }, { status: 404 })
		}
		return HttpResponse.json([
			{
				person: {
					id: '660e8400-e29b-41d4-a716-446655440001',
					name: 'Bob',
					age: 30,
					location: 'NYC',
					gender: 'male',
				},
				compatibility_score: 0.8,
				match_explanation: 'Both based in NYC, Compatible age range (28 and 30)',
				is_cross_matchmaker: true,
			},
		])
	}),

	// DELETE /api/people/:id - Success (soft delete)
	http.delete(`${BASE_URL}/api/people/:id`, ({ request, params }) => {
		let auth = request.headers.get('Authorization')
		if (auth !== 'Bearer valid-token') {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		let { id } = params
		if (id === 'not-found-id') {
			return HttpResponse.json({ error: 'Person not found' }, { status: 404 })
		}
		// Soft delete returns the person with active=false
		return HttpResponse.json({
			id: id,
			name: 'Alice',
			matchmaker_id: '123e4567-e89b-12d3-a456-426614174000',
			age: 28,
			location: 'New York',
			gender: 'female',
			preferences: { ageRange: [25, 35] },
			personality: { introvert: false },
			notes: 'Looking for someone creative',
			active: false,
			created_at: '2026-01-08T00:00:00.000Z',
			updated_at: new Date().toISOString(),
		})
	}),

	// POST /api/feedback - Success
	http.post(`${BASE_URL}/api/feedback`, async ({ request }) => {
		let auth = request.headers.get('Authorization')
		if (auth !== 'Bearer valid-token') {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		let body = (await request.json()) as {
			introduction_id: string
			from_person_id: string
			content: string
			sentiment?: string
		}
		return HttpResponse.json(
			{
				id: '880e8400-e29b-41d4-a716-446655440000',
				introduction_id: body.introduction_id,
				from_person_id: body.from_person_id,
				content: body.content,
				sentiment: body.sentiment ?? null,
				created_at: new Date().toISOString(),
			},
			{ status: 201 }
		)
	}),

	// GET /api/feedback/:id - Success (get single feedback)
	http.get(`${BASE_URL}/api/feedback/:id`, ({ request, params }) => {
		let auth = request.headers.get('Authorization')
		if (auth !== 'Bearer valid-token') {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		let { id } = params
		if (id === 'not-found-id') {
			return HttpResponse.json({ error: 'Feedback not found' }, { status: 404 })
		}
		return HttpResponse.json({
			id: id,
			introduction_id: '770e8400-e29b-41d4-a716-446655440000',
			from_person_id: '550e8400-e29b-41d4-a716-446655440001',
			content: 'Great match! We had a wonderful time.',
			sentiment: 'positive',
			created_at: new Date().toISOString(),
		})
	}),

	// GET /api/feedback - Success (list feedback for an introduction)
	http.get(`${BASE_URL}/api/feedback`, ({ request }) => {
		let auth = request.headers.get('Authorization')
		if (auth !== 'Bearer valid-token') {
			return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		let url = new URL(request.url)
		let introductionId = url.searchParams.get('introductionId')
		if (!introductionId) {
			return HttpResponse.json({ error: 'introductionId is required' }, { status: 400 })
		}
		return HttpResponse.json([
			{
				id: '880e8400-e29b-41d4-a716-446655440000',
				introduction_id: introductionId,
				from_person_id: '550e8400-e29b-41d4-a716-446655440001',
				content: 'Great match! We had a wonderful time.',
				sentiment: 'positive',
				created_at: new Date().toISOString(),
			},
			{
				id: '880e8400-e29b-41d4-a716-446655440001',
				introduction_id: introductionId,
				from_person_id: '550e8400-e29b-41d4-a716-446655440002',
				content: 'Nice person, but not my type.',
				sentiment: 'neutral',
				created_at: new Date().toISOString(),
			},
		])
	}),
]
