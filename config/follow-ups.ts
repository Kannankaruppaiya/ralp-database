import { FollowUpMilestone } from '@/types/follow-up';

export interface MilestoneConfig {
  milestone: FollowUpMilestone;
  months: number;
  label: string;
  shortLabel: string;
  description: string;
  requiredFields: string[];
}

export const FOLLOW_UP_MILESTONES: MilestoneConfig[] = [
  {
    milestone: '2m',
    months: 2,
    label: '1st Follow-up (2 Months)',
    shortLabel: '2 Months',
    description: 'Initial catheter removal review, early continence recovery, baseline PSA nadir check.',
    requiredFields: ['psa', 'ipss', 'shim', 'incontinence'],
  },
  {
    milestone: '6m',
    months: 6,
    label: '2nd Follow-up (6 Months)',
    shortLabel: '6 Months',
    description: 'Mid-term continence consolidation, early erectile function recovery curve, ultra-sensitive PSA check.',
    requiredFields: ['psa', 'ipss', 'shim', 'incontinence'],
  },
  {
    milestone: '12m',
    months: 12,
    label: '3rd Follow-up (12 Months / 1 Year)',
    shortLabel: '12 Months',
    description: '1-Year Trifecta assessment: pad-free continence, potency recovery, oncological PSA stability.',
    requiredFields: ['psa', 'ipss', 'shim', 'incontinence'],
  },
  {
    milestone: '18m',
    months: 18,
    label: '4th Follow-up (18 Months)',
    shortLabel: '18 Months',
    description: 'Long-term functional stability, late potency gains assessment, PSA surveillance.',
    requiredFields: ['psa', 'ipss', 'shim', 'incontinence'],
  },
  {
    milestone: '24m',
    months: 24,
    label: '5th Follow-up (24 Months / 2 Years)',
    shortLabel: '24 Months',
    description: '2-Year Pentafecta benchmark: oncological cure, continence, potency, no surgical complications.',
    requiredFields: ['psa', 'ipss', 'shim', 'incontinence'],
  },
  {
    milestone: '30m',
    months: 30,
    label: '6th Follow-up (30 Months)',
    shortLabel: '30 Months',
    description: 'Surveillance follow-up for delayed biochemical progression or late functional changes.',
    requiredFields: ['psa', 'ipss', 'shim', 'incontinence'],
  },
  {
    milestone: '36m',
    months: 36,
    label: '7th Follow-up (36 Months / 3 Years)',
    shortLabel: '36 Months',
    description: '3-Year long-term clinical registry milestone. Discharge planning or ongoing annual surveillance transition.',
    requiredFields: ['psa', 'ipss', 'shim', 'incontinence'],
  },
];
