/** Persistence port for the Person aggregate. Implementations live in adapter packages. */
import type { Person, PersonInput } from '../domain/person.js'

export type PersonUpdate = Partial<Omit<PersonInput, 'id' | 'createdAt'>>

export interface IPersonRepository {
	findById(id: string): Promise<Person | null>
	findByMatchmakerId(matchmakerId: string): Promise<readonly Person[]>
	create(person: Person): Promise<Person>
	/** Throws PersonNotFoundError when no row matches `id`. */
	update(id: string, patch: PersonUpdate): Promise<Person>
	/** Throws PersonNotFoundError when no row matches `id`. */
	delete(id: string): Promise<void>
}
