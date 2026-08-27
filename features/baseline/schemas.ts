import { z } from 'zod';

export const BaselineCancerSchema = z.object({
  psa: z.number().min(0.01, 'PSA is required'),
  gleasonGrade: z.enum(['3+3', '3+4', '4+3', '4+4', '4+5', '5+4', '5+5']),
  gradeGroup: z.number().min(1).max(5),
  percentPositiveCoresWorst: z.number().min(1).max(100).optional(),
  percentPositiveCoresBest: z.number().min(1).max(100).optional(),
  ukbScore: z.number().min(1).max(100).optional(),
  clinicalStage: z.enum(['2A', '2B', '2C', '3A', '3B', '4']),
});
