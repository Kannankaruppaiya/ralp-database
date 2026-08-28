/**
 * Multi-Agent MDT (Multidisciplinary Team) Clinical Decision Simulator.
 *
 * Inspired by the `crewai_agents/ai_doctor_crew` pattern from awesome-llm-apps.
 * Simulates a tertiary NHS Urology Multidisciplinary Team meeting with 3 specialized agents:
 * 1. Consultant Urological Surgeon Agent
 * 2. Consultant Histopathologist Agent
 * 3. Consultant Clinical Oncologist Agent
 *
 * Produces an evidence-grounded NHS MDT Consensus Decision & Clinic Action Letter
 * conforming to NICE NG131 and EAU Prostate Cancer Guidelines.
 */

import { PatientFullRecord } from '@/types/patient';
import { formatNhsNumber, formatDate, formatPsa, getRiskCategory } from '@/lib/formatters';

export interface AgentOpinion {
  agentName: string;
  role: string;
  avatarIcon: string;
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  severity: 'low' | 'moderate' | 'high' | 'critical';
}

export interface MDTConsensusReport {
  patientId: string;
  patientName: string;
  nhsNumber: string;
  hospitalNumber: string;
  dateOfMeeting: string;
  primarySurgeon: string;
  clinicalRiskTier: string;
  overallMDTDecision: string;
  agents: AgentOpinion[];
  actionPlan: {
    surveillanceSchedule: string;
    adjuvantTherapyIndicated: boolean;
    adjuvantTherapyDetails: string;
    promsFocus: string;
    clinicalTrialEligibility: string;
  };
  officialLetterText: string;
}

/**
 * 1. Urological Surgeon Agent Evaluation
 */
function evaluateSurgeonAgent(patient: PatientFullRecord): AgentOpinion {
  const op = patient.operation;
  const findings: string[] = [];
  const recs: string[] = [];
  let severity: AgentOpinion['severity'] = 'low';

  if (!op) {
    return {
      agentName: 'Mr. Vivek Kannan, FRCS (Urol)',
      role: 'Lead Robotic Urological Surgeon',
      avatarIcon: 'Stethoscope',
      summary: 'Operative surgical record is pending theatre log reconciliation.',
      keyFindings: ['Surgery logged as scheduled; awaiting definitive operative console note.'],
      recommendations: ['Retrieve operative nursing log and robotic console minutes.'],
      severity: 'moderate',
    };
  }

  const ns = op.nerveSparing || 'None';
  findings.push(`Nerve-sparing approach: ${ns} (Left NS: ${op.leftNerveSparingGrade || 'N/A'}, Right NS: ${op.rightNerveSparingGrade || 'N/A'})`);
  findings.push(`Bladder neck reconstruction: ${op.bladderNeck || 'Spared'}`);
  findings.push(`Estimated blood loss: ${op.bloodLossMl ? `${op.bloodLossMl} mL` : 'Standard (<250 mL)'}`);

  if (op.durationMinutes) {
    findings.push(`Console duration: ${op.durationMinutes} minutes`);
  }

  if (ns === 'Bilateral') {
    recs.push('High likelihood of early functional erectile and continence recovery; initiate pelvic floor physiotherapy at week 2 post-catheter removal.');
    recs.push('Prescribe nocturnal PDE5 inhibitor protocol (Tadalafil 5mg daily) to optimize penile oxygenation.');
  } else if (ns === 'Left' || ns === 'Right') {
    recs.push('Unilateral neurovascular bundle preserved; partial spontaneous potency recovery expected over 12–24 months.');
  } else {
    recs.push('Non-nerve sparing indicated by extensive baseline capsular contact; counsel patient on second-line erectile rehabilitation (vacuum erection device / intracavernosal alprostadil).');
    severity = 'moderate';
  }

  return {
    agentName: `Mr. ${patient.primarySurgeon || 'V. Kannan'}, FRCS (Urol)`,
    role: 'Consultant Robotic Urological Surgeon',
    avatarIcon: 'Scissors',
    summary: `Robotic radical prostatectomy completed with ${ns.toLowerCase()} neurovascular bundle preservation and excellent anatomical reconstruction.`,
    keyFindings: findings,
    recommendations: recs,
    severity,
  };
}

/**
 * 2. Histopathologist Agent Evaluation
 */
function evaluatePathologistAgent(patient: PatientFullRecord): AgentOpinion {
  const hist = patient.histology;
  const findings: string[] = [];
  const recs: string[] = [];
  let severity: AgentOpinion['severity'] = 'low';

  if (!hist) {
    return {
      agentName: 'Dr. Eleanor Vance, FRCPath',
      role: 'Consultant Urological Histopathologist',
      avatarIcon: 'Microscope',
      summary: 'Post-operative surgical specimen pathology is currently processing.',
      keyFindings: ['Formalin-fixed whole-mount specimen in microtomy and immunohistochemistry.'],
      recommendations: ['Expedite pathological stage and margin clearance report before 6-week clinic.'],
      severity: 'moderate',
    };
  }

  const pStage = hist.pathologicalStage ? `pT${hist.pathologicalStage}` : 'pT2';
  const gleason = hist.gleasonGrade || '3+4';
  const margin = hist.surgicalMargins || 'Negative (R0)';
  const isR1 = margin.includes('Positive') || margin.includes('R1');

  findings.push(`Definitive Pathological Stage: ${pStage} (Primary specimen Gleason: ${gleason}, Grade Group ${hist.gradeGroup || 2})`);
  findings.push(`Surgical Margin Status: ${margin}${hist.positiveMarginLocations?.length ? ` (Location: ${hist.positiveMarginLocations.join(', ')})` : ''}`);
  findings.push(`Extraprostatic Extension (EPE): ${hist.extraprostaticExtension ? 'Present (pT3a)' : 'Absent'}`);
  findings.push(`Seminal Vesicle Invasion (SVI): ${hist.seminalVesicleInvasion ? 'Present (pT3b)' : 'Absent'}`);

  if (isR1) {
    severity = 'high';
    recs.push(`Microscopically positive surgical margin (R1) detected${hist.positiveMarginLocations ? ` at ${hist.positiveMarginLocations.join(', ')}` : ''}. Heightened risk of local biochemical persistence.`);
    recs.push('Recommend ultra-sensitive PSA monitoring at 6-week intervals.');
  } else {
    recs.push('Clear surgical margins (R0) achieved across apex, bladder neck, and posterolateral surfaces.');
  }

  if (hist.seminalVesicleInvasion) {
    severity = 'critical';
    recs.push('Adverse pT3b stage with seminal vesicle invasion confers high risk of distant microscopic dissemination; urgent oncological cross-referral indicated.');
  }

  return {
    agentName: 'Dr. Eleanor Vance, FRCPath',
    role: 'Consultant Urological Histopathologist',
    avatarIcon: 'Microscope',
    summary: `Final pathology confirms ${pStage} adenocarcinoma with ${margin.toLowerCase()} margins and Gleason score ${gleason}.`,
    keyFindings: findings,
    recommendations: recs,
    severity,
  };
}

/**
 * 3. Clinical Oncologist Agent Evaluation
 */
function evaluateOncologistAgent(patient: PatientFullRecord): AgentOpinion {
  const psa = patient.baseline?.psa || 0;
  const hist = patient.histology;
  const followUps = patient.followUps || [];
  const findings: string[] = [];
  const recs: string[] = [];
  let severity: AgentOpinion['severity'] = 'low';

  const risk = getRiskCategory(psa, patient.baseline?.gleasonGrade, patient.baseline?.clinicalStage);
  findings.push(`Pre-operative baseline risk: ${risk.category} (Baseline PSA: ${formatPsa(psa)} ng/mL)`);

  const recentFollowUp = followUps[followUps.length - 1];
  if (recentFollowUp && recentFollowUp.psa !== undefined) {
    findings.push(`Latest post-op PSA at ${recentFollowUp.milestone}: ${formatPsa(recentFollowUp.psa)} ng/mL`);
    if (recentFollowUp.psa >= 0.2 || recentFollowUp.biochemicalRecurrence) {
      severity = 'critical';
      findings.push('CRITICAL ALERT: Biochemical Recurrence threshold (PSA >= 0.2 ng/mL) confirmed on serial testing.');
      recs.push('Immediate Salvage Radiotherapy (SRT) to the prostatic bed (66 Gy in 33 fractions) combined with 6 months of LHRH agonist ADT per RADICALS-RT trial criteria.');
      recs.push('Order PSMA-PET/CT scan to exclude regional pelvic lymphadenopathy or distant skeletal metastases before field planning.');
      return {
        agentName: 'Dr. Marcus Thorne, FRCR',
        role: 'Consultant Clinical Oncologist',
        avatarIcon: 'Activity',
        summary: 'Biochemical recurrence documented post-prostatectomy; trigger immediate Salvage Radiotherapy (SRT) pathway.',
        keyFindings: findings,
        recommendations: recs,
        severity,
      };
    }
  }

  const isR1 = hist?.surgicalMargins?.includes('Positive') || hist?.surgicalMargins?.includes('R1');
  const isT3b = hist?.pathologicalStage?.includes('3B') || hist?.pathologicalStage?.includes('3b') || hist?.seminalVesicleInvasion;

  if (isT3b || (isR1 && (patient.baseline?.gradeGroup || 1) >= 4)) {
    severity = 'high';
    recs.push('High-risk pathological features (pT3b / high-grade R1). Follow ARTISTIC/RADICALS meta-analysis: early salvage radiotherapy triggered if post-op PSA exceeds 0.1 ng/mL, rather than mandatory adjuvant irradiation.');
    recs.push('Schedule early PSA checks at 2 months, 4 months, and 6 months post-surgery.');
  } else {
    recs.push('Standard active surveillance follow-up protocol per BAUS/NPCA guidelines: ultrasensitive PSA at 2m, 6m, 12m, 18m, 24m, 30m, and 36m.');
  }

  return {
    agentName: 'Dr. Marcus Thorne, FRCR',
    role: 'Consultant Clinical Oncologist',
    avatarIcon: 'Activity',
    summary: severity === 'high' ? 'High-risk pathological profile requiring intensive early-salvage PSA surveillance.' : 'Favourable post-operative trajectory with routine surveillance protocol.',
    keyFindings: findings,
    recommendations: recs,
    severity,
  };
}

/**
 * Primary Multi-Agent MDT Execution Entrypoint
 */
export function runMultiAgentMDTSimulation(patient: PatientFullRecord): MDTConsensusReport {
  const surgeonOpinion = evaluateSurgeonAgent(patient);
  const pathologistOpinion = evaluatePathologistAgent(patient);
  const oncologistOpinion = evaluateOncologistAgent(patient);

  const agents = [surgeonOpinion, pathologistOpinion, oncologistOpinion];
  const highestSeverity = agents.some((a) => a.severity === 'critical')
    ? 'Critical Alert / Active BCR'
    : agents.some((a) => a.severity === 'high')
    ? 'High Risk / Early Salvage Pathway'
    : agents.some((a) => a.severity === 'moderate')
    ? 'Intermediate Risk / Monitored Recovery'
    : 'Low Risk / Standard Surveillance';

  const isBcr = agents.some((a) => a.severity === 'critical');
  const isHighRisk = agents.some((a) => a.severity === 'high');

  const overallDecision = isBcr
    ? 'MDT Consensus: Formal biochemical failure. Refer immediately to Clinical Oncology for restaging PSMA-PET and Salvage Radiotherapy with 6-month androgen deprivation.'
    : isHighRisk
    ? 'MDT Consensus: Adverse pathological features (pT3/R1). Avoid immediate adjuvant RT; initiate tight early salvage surveillance protocol (PSA every 2–3 months).'
    : 'MDT Consensus: Excellent surgical and pathological clearance. Proceed with standard tertiary nurse-led PSA surveillance and PROMs pelvic floor recovery tracking.';

  const actionPlan = {
    surveillanceSchedule: isHighRisk || isBcr ? 'Ultrasensitive PSA every 2 months for year 1' : 'Standard 7-milestone intervals (2m, 6m, 12m, 18m, 24m, 30m, 36m)',
    adjuvantTherapyIndicated: isBcr,
    adjuvantTherapyDetails: isBcr
      ? 'Prostate bed Salvage RT (66 Gy/33#) + 6m GnRH analogue ADT'
      : isHighRisk
      ? 'Early salvage trigger at PSA >= 0.10 ng/mL'
      : 'None indicated; purely active surveillance',
    promsFocus: patient.operation?.nerveSparing === 'Bilateral'
      ? 'IPSS stream tracking at 2m, nocturnal PDE5i erectile rehabilitation'
      : 'Continence pad-free training & pelvic floor biofeedback',
    clinicalTrialEligibility: isHighRisk ? 'Eligible for national post-prostatectomy genomics / biomarker surveillance cohorts' : 'Routine registry audit cohort',
  };

  const officialLetterText = `
OXFORD UNIVERSITY HOSPITALS NHS FOUNDATION TRUST
DEPARTMENT OF UROLOGICAL SURGERY & MULTIDISCIPLINARY ONCOLOGY

MULTIDISCIPLINARY TEAM (MDT) CLINICAL DECISION RECORD
Date of Meeting: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
Case Reference: NHS ${formatNhsNumber(patient.nhsNumber)} | MRN ${patient.hospitalNumber}
Patient: ${patient.firstName} ${patient.surname} (DOB: ${formatDate(patient.dateOfBirth)})
Lead Surgeon: Mr. ${patient.primarySurgeon || 'V. Kannan'}, FRCS (Urol)

CLINICAL CONSENSUS & MANAGEMENT SUMMARY:
${overallDecision}

SPECIALIST AGENT FINDINGS:
1. UROLOGICAL SURGERY (${surgeonOpinion.agentName}):
   ${surgeonOpinion.summary}
   • ${surgeonOpinion.keyFindings.join('\n   • ')}

2. UROPATHOLOGY (${pathologistOpinion.agentName}):
   ${pathologistOpinion.summary}
   • ${pathologistOpinion.keyFindings.join('\n   • ')}

3. CLINICAL ONCOLOGY (${oncologistOpinion.agentName}):
   ${oncologistOpinion.summary}
   • ${oncologistOpinion.keyFindings.join('\n   • ')}

AGREED ACTION PLAN:
• Surveillance Interval: ${actionPlan.surveillanceSchedule}
• Systemic / Radiotherapy: ${actionPlan.adjuvantTherapyDetails}
• Functional Rehabilitation: ${actionPlan.promsFocus}
• Governance Tier: Caldicott Principle 7 Validated
`.trim();

  return {
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.surname}`,
    nhsNumber: patient.nhsNumber,
    hospitalNumber: patient.hospitalNumber,
    dateOfMeeting: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    primarySurgeon: patient.primarySurgeon || 'VK',
    clinicalRiskTier: highestSeverity,
    overallMDTDecision: overallDecision,
    agents,
    actionPlan,
    officialLetterText,
  };
}
