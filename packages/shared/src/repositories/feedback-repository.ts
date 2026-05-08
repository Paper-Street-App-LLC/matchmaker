/** Persistence port for the Feedback aggregate. Implementations live in adapter packages. */
import type { Feedback } from '../domain/feedback.js'

export interface IFeedbackRepository {
	create(feedback: Feedback): Promise<Feedback>
	findById(id: string): Promise<Feedback | null>
	findByIntroductionId(introductionId: string): Promise<readonly Feedback[]>
}
