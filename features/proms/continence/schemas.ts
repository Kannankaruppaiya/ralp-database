import { z } from 'zod';
export * from '@/types/prom';

export const ContinenceSchema = z.object({
  dayStatus: z.enum([
    'Completely dry, no pad',
    'Occasional leakage, no pad',
    '1 pad/day',
    '2 pads/day',
    '>=3 pads/day',
  ]),
  nightPads: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
});
