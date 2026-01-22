import { z } from "zod";

export let waitlistSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	name: z.string().min(1, "Name is required"),
	organization: z.string().optional(),
	phone: z.string().optional(),
	how_heard: z
		.enum(["search", "social_media", "friend_referral", "blog_article", "other"])
		.optional(),
	message: z.string().optional(),
});

export type WaitlistFormData = z.infer<typeof waitlistSchema>;
