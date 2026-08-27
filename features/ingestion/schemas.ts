import { z } from 'zod';
export * from '@/types/ingestion';

export const IngestionJobSchema = z.object({
  documentTitle: z.string().min(1),
  sourceType: z.enum(['word_document', 'google_form_csv', 'pdf', 'clinic_letter', 'theatre_note']),
});
