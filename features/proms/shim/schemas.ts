import { z } from 'zod';
export * from '@/types/prom';

export const SHIMSchema = z.object({
  confidence: z.number().min(1).max(5),
  firmness: z.number().min(0).max(5),
  maintenanceFrequency: z.number().min(0).max(5),
  maintenanceDifficulty: z.number().min(0).max(5),
  satisfaction: z.number().min(0).max(5),
});
