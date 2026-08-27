/**
 * Translation between Postgres rows (snake_case, flat) and the app's domain
 * types (camelCase, nested). Kept in one file so a schema change has exactly
 * one place to land.
 */
import { PatientFullRecord } from '@/types/patient';
import { BaselineCancerData } from '@/types/cancer';
import { OperationData } from '@/types/operation';
import { HistologyData } from '@/types/histology';
import { FollowUpRecord } from '@/types/follow-up';
import { PromSubmission, IPSSSeverity, SHIMSeverity } from '@/types/prom';
import { AuditLogEntry } from '@/types/audit';

type Row = Record<string, any>;

/** NHS numbers are stored as 10 digits and displayed in 3-3-4 groups. */
export const formatNhs = (n: string) => n.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
export const stripNhs = (n: string) => n.replace(/\D/g, '');

/** Whole years between date of birth and today. */
function ageFrom(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function ipssSeverity(total: number): IPSSSeverity {
  return total >= 20 ? 'Severe' : total >= 8 ? 'Moderate' : 'Mild';
}

export function shimSeverity(total: number): SHIMSeverity {
  if (total >= 22) return 'No ED';
  if (total >= 17) return 'Mild ED';
  if (total >= 12) return 'Mild to Moderate ED';
  if (total >= 8) return 'Moderate ED';
  return 'Severe ED';
}

/**
 * Drops keys whose value is `undefined`.
 *
 * Upserts built from a Partial<T> would otherwise send `null` for every field
 * the caller omitted, silently erasing data the form never displayed. With the
 * key absent, ON CONFLICT DO UPDATE leaves that column untouched.
 */
function compact(row: Row): Row {
  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined));
}

export function toBaseline(r: Row | null): BaselineCancerData | undefined {
  if (!r) return undefined;
  return {
    patientId: r.patient_id,
    psa: Number(r.psa),
    psaDate: r.psa_date ?? undefined,
    gleasonGrade: r.gleason_grade,
    gradeGroup: r.grade_group,
    percentPositiveCoresWorst: r.percent_positive_cores_worst,
    percentPositiveCoresBest: r.percent_positive_cores_best,
    ukbScore: r.ukb_score,
    clinicalStage: r.clinical_stage,
    mriPIRADS: r.mri_pirads ?? undefined,
    prostateVolumeCc: r.prostate_volume_cc ?? undefined,
    biopsyDate: r.biopsy_date ?? undefined,
    notes: r.notes ?? undefined,
    updatedAt: r.updated_at,
  };
}

export function fromBaseline(patientId: string, d: Partial<BaselineCancerData>): Row {
  return compact({
    patient_id: patientId,
    psa: d.psa,
    psa_date: d.psaDate || null,
    gleason_grade: d.gleasonGrade,
    // grade_group is a generated column — deliberately not written
    percent_positive_cores_worst: d.percentPositiveCoresWorst,
    percent_positive_cores_best: d.percentPositiveCoresBest,
    ukb_score: d.ukbScore,
    clinical_stage: d.clinicalStage,
    mri_pirads: d.mriPIRADS,
    prostate_volume_cc: d.prostateVolumeCc,
    biopsy_date: d.biopsyDate || null,
    notes: d.notes,
  });
}

export function toOperation(r: Row | null): OperationData | undefined {
  if (!r) return undefined;
  return {
    patientId: r.patient_id,
    surgeon: r.surgeon,
    otherSurgeonName: r.other_surgeon_name ?? undefined,
    assistantName: r.assistant_name ?? undefined,
    operationDate: r.operation_date,
    bladderNeck: r.bladder_neck,
    nerveSparing: r.nerve_sparing,
    leftNerveSparingGrade: r.left_nerve_sparing_grade,
    rightNerveSparingGrade: r.right_nerve_sparing_grade,
    sphincter: r.sphincter,
    anteriorReconstruction: r.anterior_reconstruction,
    posteriorReconstruction: r.posterior_reconstruction,
    lymphNodeDissection: r.lymph_node_dissection,
    lymphNodeCount: r.lymph_node_count ?? undefined,
    bloodLossMl: r.blood_loss_ml,
    durationMinutes: r.duration_minutes,
    consoleDurationMinutes: r.console_duration_minutes ?? undefined,
    robotType: r.robot_type ?? undefined,
    intraoperativeComplications: r.intraoperative_complications ?? undefined,
    catheterType: r.catheter_type ?? undefined,
    drainPlaced: r.drain_placed,
    notes: r.notes ?? undefined,
    updatedAt: r.updated_at,
  };
}

export function fromOperation(patientId: string, d: Partial<OperationData>): Row {
  return compact({
    patient_id: patientId,
    surgeon: d.surgeon,
    other_surgeon_name: d.otherSurgeonName,
    assistant_name: d.assistantName,
    operation_date: d.operationDate,
    bladder_neck: d.bladderNeck,
    nerve_sparing: d.nerveSparing,
    left_nerve_sparing_grade: d.leftNerveSparingGrade,
    right_nerve_sparing_grade: d.rightNerveSparingGrade,
    sphincter: d.sphincter,
    anterior_reconstruction: d.anteriorReconstruction,
    posterior_reconstruction: d.posteriorReconstruction,
    lymph_node_dissection: d.lymphNodeDissection,
    lymph_node_count: d.lymphNodeCount,
    blood_loss_ml: d.bloodLossMl,
    duration_minutes: d.durationMinutes,
    console_duration_minutes: d.consoleDurationMinutes,
    robot_type: d.robotType,
    intraoperative_complications: d.intraoperativeComplications,
    catheter_type: d.catheterType,
    drain_placed: d.drainPlaced,
    notes: d.notes,
  });
}

export function toHistology(r: Row | null): HistologyData | undefined {
  if (!r) return undefined;
  return {
    patientId: r.patient_id,
    reportDate: r.report_date,
    pathologist: r.pathologist ?? undefined,
    specimenWeightGrams: r.specimen_weight_grams ?? undefined,
    gleasonGrade: r.gleason_grade,
    gradeGroup: r.grade_group,
    tertiaryPattern: r.tertiary_pattern ?? undefined,
    pathologicalStage: r.pathological_stage,
    surgicalMargins: r.surgical_margins,
    positiveMarginLocations: r.positive_margin_locations ?? undefined,
    marginLengthMm: r.margin_length_mm ?? undefined,
    extraprostaticExtension: r.extraprostatic_extension,
    seminalVesicleInvasion: r.seminal_vesicle_invasion,
    tumorVolumePercent: r.tumor_volume_percent ?? undefined,
    lymphovascularInvasion: r.lymphovascular_invasion,
    lymphNodesExamined: r.lymph_nodes_examined ?? undefined,
    lymphNodesPositive: r.lymph_nodes_positive ?? undefined,
    notes: r.notes ?? undefined,
    updatedAt: r.updated_at,
  };
}

export function fromHistology(patientId: string, d: Partial<HistologyData>): Row {
  return compact({
    patient_id: patientId,
    report_date: d.reportDate,
    pathologist: d.pathologist,
    specimen_weight_grams: d.specimenWeightGrams,
    gleason_grade: d.gleasonGrade,
    tertiary_pattern: d.tertiaryPattern,
    pathological_stage: d.pathologicalStage,
    surgical_margins: d.surgicalMargins,
    positive_margin_locations: d.positiveMarginLocations,
    margin_length_mm: d.marginLengthMm,
    extraprostatic_extension: d.extraprostaticExtension,
    seminal_vesicle_invasion: d.seminalVesicleInvasion,
    tumor_volume_percent: d.tumorVolumePercent,
    lymphovascular_invasion: d.lymphovascularInvasion,
    lymph_nodes_examined: d.lymphNodesExamined,
    lymph_nodes_positive: d.lymphNodesPositive,
    notes: d.notes,
  });
}

export function toFollowUp(r: Row): FollowUpRecord {
  return {
    id: r.id,
    patientId: r.patient_id,
    milestone: r.milestone,
    targetMonths: r.target_months,
    dueDate: r.due_date,
    completedDate: r.completed_date ?? undefined,
    status: r.status,
    psa: r.psa === null ? undefined : Number(r.psa),
    psaDate: r.psa_date ?? undefined,
    biochemicalRecurrence: r.bcr ?? undefined,
    ipssScore:
      r.ipss_score === null
        ? undefined
        : { totalScore: r.ipss_score, qualityOfLife: 0, severity: ipssSeverity(r.ipss_score) },
    shimScore:
      r.shim_score === null
        ? undefined
        : { totalScore: r.shim_score, severity: shimSeverity(r.shim_score) },
    continence: r.continence_day
      ? { dayStatus: r.continence_day, nightPads: r.continence_night ?? 0 }
      : undefined,
    promSubmitted: r.prom_submitted,
    notes: r.notes ?? undefined,
  };
}

export function fromFollowUp(d: FollowUpRecord): Row {
  return compact({
    patient_id: d.patientId,
    milestone: d.milestone,
    target_months: d.targetMonths,
    due_date: d.dueDate,
    status: d.status,
    psa: d.psa,
    psa_date: d.psaDate || null,
    ipss_score: d.ipssScore?.totalScore,
    shim_score: d.shimScore?.totalScore,
    continence_day: d.continence?.dayStatus,
    continence_night: d.continence?.nightPads,
    prom_submitted: d.promSubmitted,
    completed_date: d.completedDate || null,
    notes: d.notes,
  });
}

export function toProm(r: Row): PromSubmission {
  return {
    id: r.id,
    patientId: r.patient_id,
    milestone: r.milestone,
    completedAt: r.submitted_at,
    completedBy: r.source === 'patient_portal' ? 'patient' : 'clinician',
    ipssAnswers: r.ipss_answers ?? undefined,
    ipssScore:
      r.ipss_total === null
        ? undefined
        : {
            totalScore: r.ipss_total,
            qualityOfLife: r.ipss_qol ?? 0,
            severity: ipssSeverity(r.ipss_total),
          },
    shimAnswers: r.shim_answers ?? undefined,
    shimScore:
      r.shim_total === null
        ? undefined
        : { totalScore: r.shim_total, severity: shimSeverity(r.shim_total) },
    continence: r.continence_day
      ? { dayStatus: r.continence_day, nightPads: r.continence_night ?? 0 }
      : undefined,
  };
}

export function fromProm(d: PromSubmission): Row {
  return compact({
    patient_id: d.patientId,
    milestone: d.milestone,
    source: d.completedBy === 'patient' ? 'patient_portal' : 'clinic',
    ipss_answers: d.ipssAnswers,
    ipss_total: d.ipssScore?.totalScore,
    ipss_qol: d.ipssScore?.qualityOfLife,
    shim_answers: d.shimAnswers,
    shim_total: d.shimScore?.totalScore,
    continence_day: d.continence?.dayStatus,
    continence_night: d.continence?.nightPads,
  });
}

export function toAudit(r: Row): AuditLogEntry {
  return {
    id: String(r.id),
    timestamp: r.occurred_at,
    userId: r.actor_id ?? 'system',
    userName: r.actor_name,
    userRole: r.actor_role,
    gmcNumber: r.gmc_number ?? undefined,
    patientId: r.patient_id ?? undefined,
    patientName: r.patient_name ?? undefined,
    action: r.action,
    details: r.details ?? '',
  } as AuditLogEntry;
}

/**
 * Assembles the nested record the UI consumes from a patient row plus its
 * embedded relations (PostgREST returns these as arrays or objects depending
 * on cardinality, so both shapes are normalised here).
 */
export function toPatient(r: Row): PatientFullRecord {
  const one = (v: any) => (Array.isArray(v) ? v[0] ?? null : v ?? null);

  const baseline = toBaseline(one(r.baseline_cancer));
  const operation = toOperation(one(r.operations));
  const histology = toHistology(one(r.histology));

  const followUps: FollowUpRecord[] = (r.follow_ups ?? []).map(toFollowUp);
  const completed = followUps.filter((f) => f.status === 'completed').length;

  // Same weighting as the patient_completeness view; computed here so the
  // patient query stays a single round trip.
  const score =
    20 +
    (baseline ? 25 : 0) +
    (operation ? 25 : 0) +
    (histology ? 20 : 0) +
    Math.min(10, Math.round((completed / 7) * 10));

  return {
    id: r.id,
    firstName: r.first_name,
    surname: r.surname,
    dateOfBirth: r.date_of_birth,
    age: ageFrom(r.date_of_birth),
    nhsNumber: formatNhs(r.nhs_number),
    hospitalNumber: r.hospital_number,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    address: r.address ?? undefined,
    postcode: r.postcode ?? undefined,
    primarySurgeon: r.primary_surgeon,
    otherSurgeonName: r.other_surgeon_name ?? undefined,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    baseline,
    operation,
    histology,
    followUps: followUps.sort((a, b) => a.targetMonths - b.targetMonths),
    proms: (r.prom_submissions ?? []).map(toProm),
    completeness: {
      score,
      baselineComplete: !!baseline,
      operationComplete: !!operation,
      histologyComplete: !!histology,
      followUpsComplete: completed,
      totalFollowUpsExpected: 7,
      missingFields: [
        !baseline && 'Baseline Cancer Data',
        !operation && 'Operation Theatre Data',
        !histology && 'Post-Op Histology',
      ].filter(Boolean) as string[],
    },
  };
}
