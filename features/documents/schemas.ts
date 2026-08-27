import { z } from 'zod';
export * from '@/types/document';

export const DocumentUploadSchema = z.object({
  title: z.string().min(1),
  docType: z.enum(['Theatre Operation Note', 'Post-Op Histology Report', 'Clinic Follow-up Letter', 'MDT Summary', 'Patient Questionnaire Form', 'Other']),
});
