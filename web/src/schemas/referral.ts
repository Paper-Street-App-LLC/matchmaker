import { z } from "zod";

/**
 * Validation schema for referral form
 * Used when a single person refers a matchmaker to the platform
 */
let referralSchema = z.object({
	// Single (person making the referral)
	single_name: z.string().min(1, "Your name is required"),
	single_email: z.string().email("Please enter a valid email address"),

	// Matchmaker being referred
	matchmaker_name: z.string().optional(),
	matchmaker_email: z.string().email("Please enter a valid matchmaker email address"),

	// Optional message
	message: z.string().optional(),
});

export { referralSchema };
export type ReferralFormData = z.infer<typeof referralSchema>;
