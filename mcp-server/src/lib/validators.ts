import { z } from 'zod';

/**
 * Zod schema for matchmaker input validation
 */
export let matchmakerInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export type MatchmakerInput = z.infer<typeof matchmakerInputSchema>;

/**
 * Zod schema for person input validation
 */
export let personInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  matchmakerId: z.string().uuid('Invalid matchmaker ID format'),
});

export type PersonInput = z.infer<typeof personInputSchema>;
