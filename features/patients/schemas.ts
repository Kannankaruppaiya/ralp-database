import { z } from 'zod';

export const PatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  surname: z.string().min(1, 'Surname is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  nhsNumber: z.string().min(10, 'Valid 10-digit NHS number required'),
  hospitalNumber: z.string().min(1, 'Hospital number is required'),
  primarySurgeon: z.enum(['VK', 'RDM', 'CI', 'OAK', 'OTHER']),
});

export type PatientFormValues = z.infer<typeof PatientSchema>;
