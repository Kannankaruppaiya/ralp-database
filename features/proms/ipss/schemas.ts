import { z } from 'zod';
export * from '@/types/prom';

export const IPSSSchema = z.object({
  incompleteEmptying: z.number().min(0).max(5),
  frequency: z.number().min(0).max(5),
  intermittency: z.number().min(0).max(5),
  urgency: z.number().min(0).max(5),
  weakStream: z.number().min(0).max(5),
  straining: z.number().min(0).max(5),
  nocturia: z.number().min(0).max(5),
  qualityOfLife: z.number().min(0).max(6),
});
