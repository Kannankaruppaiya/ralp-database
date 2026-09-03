import { GleasonGrade, GradeGroup, ClinicalStage } from '@/types/cancer';
import { BladderNeckStatus, NerveSparingSide, NerveSparingGrade, SurgicalQualityGrade } from '@/types/operation';
import { PathologicalStage, MarginStatus } from '@/types/histology';
import { IncontinenceDayStatus, IncontinenceNightPads } from '@/types/prom';

/**
 * The roster of surgeons is data, not config — read it with `useSurgeons()`,
 * which calls the surgeon_roster() function added in migration 0012. This is
 * only the format a code must take, mirroring the check constraints on
 * profiles.surgeon_code / patients.primary_surgeon / operations.surgeon so the
 * form rejects a bad code before Postgres has to.
 */
export const SURGEON_CODE_PATTERN = /^[A-Z][A-Z0-9]{1,7}$/;
export const SURGEON_CODE_HINT =
  'Use 2-8 characters: initials in capitals, e.g. VK.';

export const GLEASON_OPTIONS: GleasonGrade[] = [
  '3+3',
  '3+4',
  '4+3',
  '4+4',
  '4+5',
  '5+4',
  '5+5',
];

export const GRADE_GROUP_MAP: Record<GleasonGrade, GradeGroup> = {
  '3+3': 1,
  '3+4': 2,
  '4+3': 3,
  '4+4': 4,
  '4+5': 5,
  '5+4': 5,
  '5+5': 5,
};

export const CLINICAL_STAGE_OPTIONS: { value: ClinicalStage; label: string; description: string }[] = [
  { value: '2A', label: 'Stage 2A (T2a N0 M0)', description: 'Tumour involves half of 1 lobe or less' },
  { value: '2B', label: 'Stage 2B (T2b N0 M0)', description: 'Tumour involves more than half of 1 lobe' },
  { value: '2C', label: 'Stage 2C (T2c N0 M0)', description: 'Tumour involves both lobes' },
  { value: '3A', label: 'Stage 3A (T3a N0 M0)', description: 'Extraprostatic extension (unilateral or bilateral)' },
  { value: '3B', label: 'Stage 3B (T3b N0 M0)', description: 'Tumour invades seminal vesicle(s)' },
  { value: '4', label: 'Stage 4 (T4 N0 M0 / Any N1)', description: 'Tumour fixed or invades adjacent structures' },
];

export const PATHOLOGICAL_STAGE_OPTIONS: PathologicalStage[] = [
  '2A',
  '2B',
  '2C',
  '3A',
  '3B',
  '4',
];

export const BLADDER_NECK_OPTIONS: { value: BladderNeckStatus; label: string }[] = [
  { value: 'sparing', label: 'Sparing (Optimal anatomical preservation)' },
  { value: 'slight wide', label: 'Slight Wide (Mild enlargement)' },
  { value: 'wide needing reconstruction', label: 'Wide Needing Reconstruction (Tennis racket closure)' },
];

export const NERVE_SPARING_OPTIONS: { value: NerveSparingSide; label: string }[] = [
  { value: 'Bilateral', label: 'Bilateral' },
  { value: 'Right', label: 'Right Only' },
  { value: 'Left', label: 'Left Only' },
  { value: 'None', label: 'Non-Nerve Sparing (Wide Excision)' },
];

export const NERVE_SPARING_GRADES: { value: NerveSparingGrade; label: string; scoreName: string }[] = [
  { value: '5/5', label: '5/5 (Full / Intrafascial)', scoreName: 'Grade 5 (Complete preservation)' },
  { value: '4/5', label: '4/5 (Interfascial)', scoreName: 'Grade 4 (Good preservation)' },
  { value: '3/5', label: '3/5 (Partial)', scoreName: 'Grade 3 (Partial sparing)' },
  { value: '2/5', label: '2/5 (Minimal / Incremental)', scoreName: 'Grade 2 (Minimal sparing)' },
  { value: 'N/A', label: 'N/A (Reversed / Resected)', scoreName: 'Non-sparing' },
];

export const SURGICAL_QUALITY_OPTIONS: { value: SurgicalQualityGrade; label: string }[] = [
  { value: 'Weak', label: 'Weak' },
  { value: 'Good', label: 'Good' },
  { value: 'Excellent', label: 'Excellent' },
];

export const INCONTINENCE_DAY_OPTIONS: { value: IncontinenceDayStatus; label: string; score: number }[] = [
  { value: 'Completely dry, no pad', label: 'Completely dry, no pad (Continent)', score: 0 },
  { value: 'Occasional leakage, no pad', label: 'Occasional leakage, no pad (Safety only)', score: 1 },
  { value: '1 pad/day', label: '1 pad / day (Mild leakage)', score: 2 },
  { value: '2 pads/day', label: '2 pads / day (Moderate leakage)', score: 3 },
  { value: '>=3 pads/day', label: '>= 3 pads / day (Severe incontinence)', score: 4 },
];

export const INCONTINENCE_NIGHT_OPTIONS: { value: IncontinenceNightPads; label: string }[] = [
  { value: 0, label: '0 pads at night (Dry)' },
  { value: 1, label: '1 pad at night' },
  { value: 2, label: '2 pads at night' },
  { value: 3, label: '3+ pads at night' },
];
