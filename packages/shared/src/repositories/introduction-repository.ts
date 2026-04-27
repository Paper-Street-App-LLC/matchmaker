/** Persistence port for the Introduction aggregate. Implementations live in adapter packages. */
import type { Introduction, IntroductionInput } from '../domain/introduction.js'

export type IntroductionUpdate = Partial<Pick<IntroductionInput, 'status' | 'notes'>>

export interface IIntroductionRepository {
	findById(id: string): Promise<Introduction | null>
	/**
	 * Returns introductions where the matchmaker is on either side
	 * (`matchmakerAId` or `matchmakerBId`).
	 *
	 * This OR is query shape, not an ownership check. `Person` has one
	 * matchmaker (a single column filter); `Introduction` has two
	 * (`matchmakerAId` and `matchmakerBId`), so "find by matchmaker" requires
	 * an OR by schema alone. Authorization is still a use-case concern —
	 * this method does not enforce it.
	 */
	findByMatchmaker(matchmakerId: string): Promise<readonly Introduction[]>
	create(introduction: Introduction): Promise<Introduction>
	/** Throws IntroductionNotFoundError when no row matches `id`. */
	update(id: string, patch: IntroductionUpdate): Promise<Introduction>
}
