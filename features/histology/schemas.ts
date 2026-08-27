import { z } from 'zod';
export * from '@/types/histology';

export const HistologySchema = z.object({
  reportDate: z.string().min(1, 'Report date is required'),
  gleasonGrade: z.enum(['3+3', '3+4', '4+3', '4+4', '4+5', '5+4', '5+5']),
  gradeGroup: z.number().min(1).max(5),
  pathologicalStage: z.enum(['2A', '2B', '2C', '3A', '3B', '4']),
  surgicalMargins: z.enum(['Negative (R0)', 'Positive (R1)', 'Uncertain (Rx)']),
  extraprostaticExtension: z.boolean(),
  seminalVesicleInvasion: z.boolean(),
});
