/** Persistence port for the Introduction aggregate. Implementations live in adapter packages. */
import type { Introduction, IntroductionInput } from '../domain/introduction.js'

export type IntroductionUpdate = Partial<Pick<IntroductionInput, 'status' | 'notes'>>

export interface IIntroductionRepository {
	findById(id: string): Promise<Introduction | null>
	/** Returns introductions where the matchmaker owns either side (matchmakerAId or matchmakerBId). */
	findByMatchmaker(matchmakerId: string): Promise<readonly Introduction[]>
	create(introduction: Introduction): Promise<Introduction>
	/** Throws IntroductionNotFoundError when no row matches `id`. */
	update(id: string, patch: IntroductionUpdate): Promise<Introduction>
}
