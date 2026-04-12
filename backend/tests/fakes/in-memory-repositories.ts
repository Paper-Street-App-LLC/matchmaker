import {
	PersonNotFoundError,
	RepositoryConflictError,
	type IMatchDecisionRepository,
	type IPersonRepository,
	type MatchDecision,
	type Person,
	type PersonUpdate,
} from '@matchmaker/shared'

export class InMemoryPersonRepository implements IPersonRepository {
	private people: Person[]

	constructor(seed: readonly Person[] = []) {
		this.people = [...seed]
	}

	async findById(id: string): Promise<Person | null> {
		return this.people.find(p => p.id === id) ?? null
	}

	async findByMatchmakerId(matchmakerId: string): Promise<readonly Person[]> {
		return this.people.filter(p => p.matchmakerId === matchmakerId)
	}

	async findAllActive(): Promise<readonly Person[]> {
		return this.people.filter(p => p.active)
	}

	async create(person: Person): Promise<Person> {
		if (this.people.some(p => p.id === person.id)) {
			throw new RepositoryConflictError(`Person already exists: ${person.id}`)
		}
		this.people.push(person)
		return person
	}

	async update(id: string, patch: PersonUpdate): Promise<Person> {
		let index = this.people.findIndex(p => p.id === id)
		if (index === -1) throw new PersonNotFoundError(id)
		let current = this.people[index]!
		let updated: Person = Object.freeze({
			...current,
			...patch,
			updatedAt: new Date(),
		})
		this.people[index] = updated
		return updated
	}

	async delete(id: string): Promise<void> {
		let index = this.people.findIndex(p => p.id === id)
		if (index === -1) throw new PersonNotFoundError(id)
		this.people.splice(index, 1)
	}
}

export class InMemoryMatchDecisionRepository implements IMatchDecisionRepository {
	private decisions: MatchDecision[]

	constructor(seed: readonly MatchDecision[] = []) {
		this.decisions = [...seed]
	}

	async findByPerson(personId: string): Promise<readonly MatchDecision[]> {
		return this.decisions.filter(d => d.personId === personId)
	}

	async findByCandidatePair(
		personId: string,
		candidateId: string,
	): Promise<MatchDecision | null> {
		return (
			this.decisions.find(
				d => d.personId === personId && d.candidateId === candidateId,
			) ?? null
		)
	}

	async create(decision: MatchDecision): Promise<MatchDecision> {
		let conflict = this.decisions.some(
			d => d.personId === decision.personId && d.candidateId === decision.candidateId,
		)
		if (conflict) {
			throw new RepositoryConflictError(
				`Decision already exists for (${decision.personId}, ${decision.candidateId})`,
			)
		}
		this.decisions.push(decision)
		return decision
	}
}
