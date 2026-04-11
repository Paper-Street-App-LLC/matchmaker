/** Persistence port for the MatchDecision aggregate. Implementations live in adapter packages. */
import type { MatchDecision } from '../domain/match-decision.js'

export interface IMatchDecisionRepository {
	findByPerson(personId: string): Promise<readonly MatchDecision[]>
	findByCandidatePair(personId: string, candidateId: string): Promise<MatchDecision | null>
	create(decision: MatchDecision): Promise<MatchDecision>
}
