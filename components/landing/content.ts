// Copy for the public landing page. Every statement here is true of the codebase
// today; outcome figures and certification claims are deliberately absent.
import { FOLLOW_UP_MILESTONES } from '@/config/follow-ups';

export const PORTALS = {
  clinician: '/login',
  patient: '/patient-login',
  governance: '/admin-login',
} as const;

export const NAV_LINKS = [
  { label: 'Patients', href: '#patients' },
  { label: 'Governance', href: '#governance' },
] as const;

export const HERO = {
  headlineLead: 'Every prostatectomy,',
  headlineRest: 'followed',
  headlineItalic: 'for three years',
  subhead:
    'One registry for the whole RALP pathway — from baseline cancer profile to the 36‑month review — with patients reporting their own recovery.',
  primary: { label: 'Open the clinician registry', href: PORTALS.clinician },
  secondary: { label: 'I’m a patient', href: PORTALS.patient },
} as const;

const FIELD_LABELS: Record<string, string> = {
  psa: 'PSA',
  ipss: 'IPSS',
  shim: 'SHIM',
  incontinence: 'Continence',
};

export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

// The timeline is rendered straight from the follow-up schedule the registry uses.
export const MILESTONES = FOLLOW_UP_MILESTONES.map((m) => ({
  id: m.milestone,
  months: m.months,
  shortLabel: m.shortLabel,
  description: m.description,
  fields: m.requiredFields.map(fieldLabel),
}));

export const LONG_VIEW = {
  eyebrow: 'The long view',
  heading: 'Seven reviews, one line, from theatre to 36 months.',
  intro:
    'Each follow-up records PSA alongside patient-reported IPSS, SHIM and continence scores, calculated on submission.',
  flagNote: 'Biochemical recurrence is flagged automatically at PSA ≥ 0.2 ng/mL.',
} as const;

export const CLINICIAN_PANEL = {
  heading: 'For the surgical team',
  lines: [
    'Baseline cancer profile and the theatre operation record, in one place.',
    'Post-operative histology alongside every follow-up.',
    'Trifecta and pentafecta benchmarking at unit and surgeon level.',
  ],
  cta: { label: 'Open the clinician registry', href: PORTALS.clinician },
} as const;

export const PATIENT_PANEL = {
  heading: 'For patients',
  body: 'Your recovery questionnaires take about 10 minutes. Your answers go straight to your surgical team.',
  cta: { label: 'Start my recovery questionnaire', href: PORTALS.patient },
} as const;

export const GOVERNANCE_PANEL = {
  heading: 'For governance',
  body: 'Audit trails, access reviews and pseudonymised exports for the Trust’s information governance team.',
  cta: { label: 'Governance sign-in', href: PORTALS.governance },
} as const;

export const INGESTION = {
  eyebrow: 'From paper to record',
  heading: 'Clinic letters become structured data, checked by a person.',
  steps: [
    {
      title: 'Upload the operation note or clinic letter',
      body: 'Word or PDF, as the document was written.',
    },
    {
      title: 'Review extracted fields side by side',
      body: 'The source text sits next to each value before anything enters the record.',
    },
    {
      title: 'Confirm, with any conflict justified in writing',
      body: 'Where a value disagrees with the record, the reviewer explains the choice.',
    },
  ],
} as const;

export const GOVERNANCE = {
  eyebrow: 'Governance',
  heading: 'The data stays where the care happens.',
  items: [
    { term: 'Data location', detail: 'Self-hosted PostgreSQL on the Trust’s own servers.' },
    { term: 'Access', detail: 'Role-based, with each patient limited to their own record.' },
    { term: 'Audit', detail: 'An append-only log of views, changes, approvals and exports.' },
    { term: 'Exports', detail: 'Pseudonymised for national audit, with NHS and hospital numbers removed.' },
  ],
} as const;

export const FOOTER_LINKS = [
  { label: 'Clinician sign-in', href: PORTALS.clinician },
  { label: 'Patient questionnaires', href: PORTALS.patient },
  { label: 'Governance sign-in', href: PORTALS.governance },
] as const;
