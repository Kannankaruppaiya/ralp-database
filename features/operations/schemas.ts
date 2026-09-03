import { z } from 'zod';
import { SURGEON_CODE_PATTERN, SURGEON_CODE_HINT } from '@/config/clinical-options';
export * from '@/types/operation';

export const OperationSchema = z.object({
  surgeon: z.string().regex(SURGEON_CODE_PATTERN, SURGEON_CODE_HINT),
  operationDate: z.string().min(1, 'Operation date is required'),
  bladderNeck: z.enum(['sparing', 'slight wide', 'wide needing reconstruction']),
  nerveSparing: z.enum(['Bilateral', 'Right', 'Left', 'None']),
  leftNerveSparingGrade: z.enum(['2/5', '3/5', '4/5', '5/5', 'N/A']),
  rightNerveSparingGrade: z.enum(['2/5', '3/5', '4/5', '5/5', 'N/A']),
  sphincter: z.enum(['Weak', 'Good', 'Excellent']),
  anteriorReconstruction: z.enum(['Weak', 'Good', 'Excellent']),
  lymphNodeDissection: z.boolean(),
  bloodLossMl: z.number().min(50).max(2500),
  durationMinutes: z.number().min(30).max(600),
});
