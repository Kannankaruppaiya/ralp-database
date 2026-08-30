import { z } from 'zod';
import { isValidNhsNumber } from '@/lib/validators';

export const PatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  surname: z.string().min(1, 'Surname is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  // Enforce the NHS-number modulus-11 check digit, not just the length — a
  // transposed or mistyped-but-10-digit number is rejected at entry.
  nhsNumber: z
    .string()
    .refine(isValidNhsNumber, 'Enter a valid NHS number (10 digits, checksum must pass)'),
  hospitalNumber: z.string().min(1, 'Hospital number is required'),
  primarySurgeon: z.enum(['VK', 'RDM', 'CI', 'OAK', 'OTHER']),
});

export type PatientFormValues = z.infer<typeof PatientSchema>;
