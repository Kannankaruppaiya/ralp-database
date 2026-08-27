import { z } from 'zod';
export * from '@/types/follow-up';

export const FollowUpSchema = z.object({
  psa: z.number().min(0).max(500).optional(),
  completedDate: z.string().optional(),
  clinicalNotes: z.string().optional(),
});
