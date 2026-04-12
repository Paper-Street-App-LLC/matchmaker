/** Persistence port for the MatchDecision aggregate. Implementations live in adapter packages. */
import type { MatchDecision } from '../domain/match-decision.js'

export interface IMatchDecisionRepository {
	/** Returns every decision recorded for `personId`, across all candidates. */
	findByPerson(personId: string): Promise<readonly MatchDecision[]>

	/**
	 * Looks up a single decision by its `(personId, candidateId)` key.
	 *
	 * Uniqueness: `(personId, candidateId)` is unique per person. Because each
	 * Person is owned by exactly one matchmaker, this is equivalent to
	 * `(matchmakerId, personId, candidateId)` without needing the matchmaker
	 * in the signature.
	 *
	 * REVISIT: if we ever allow a matchmaker to re-decide (e.g. after an
	 * introduction ends and the candidate becomes eligible again), this key
	 * needs a temporal component or this method must return the latest
	 * decision rather than the unique one.
	 */
	findByCandidatePair(personId: string, candidateId: string): Promise<MatchDecision | null>

	/**
	 * Throws `RepositoryConflictError` when a decision already exists for
	 * `(decision.personId, decision.candidateId)`.
	 *
	 * The engagement-lifecycle rule — a person can only be actively matched
	 * with one candidate at a time — lives on `Introduction`, not here.
	 * `MatchDecision` is an immutable audit log: once a matchmaker decides on
	 * a pair, that decision persists across future engagement cycles (so a
	 * previously declined candidate stays excluded from new suggestions).
	 *
	 * REVISIT: see `findByCandidatePair`.
	 */
	create(decision: MatchDecision): Promise<MatchDecision>
}
