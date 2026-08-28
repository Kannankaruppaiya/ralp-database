import { SurgeonCode } from '@/types/common';
import { GleasonGrade, ClinicalStage } from '@/types/cancer';
import { PathologicalStage, MarginStatus } from '@/types/histology';
import { NerveSparingSide } from '@/types/operation';
import { FollowUpMilestone } from '@/types/follow-up';

export interface ParsedClinicalQuery {
  rawQuery: string;
  surgeon?: SurgeonCode;
  pathologicalStage?: PathologicalStage;
  clinicalStage?: ClinicalStage;
  gleasonGrade?: GleasonGrade;
  marginStatus?: MarginStatus;
  nerveSparing?: NerveSparingSide;
  psaMin?: number;
  psaMax?: number;
  ageMin?: number;
  ageMax?: number;
  hasBcrAlert?: boolean;
  isPadFree?: boolean;
  hasOverdueFollowUp?: boolean;
  milestone?: FollowUpMilestone;
  keywords: string[];
  extractedIntents: string[];
}

export function parseClinicalQuery(query: string): ParsedClinicalQuery {
  const q = query.trim();
  const lower = q.toLowerCase();
  const intents: string[] = [];

  const result: ParsedClinicalQuery = {
    rawQuery: q,
    keywords: [],
    extractedIntents: intents,
  };

  // 1. Surgeon Detection
  if (/\b(?:surgeon\s+)?vk\b/i.test(lower)) {
    result.surgeon = 'VK';
    intents.push('Surgeon VK');
  } else if (/\b(?:surgeon\s+)?rdm\b/i.test(lower)) {
    result.surgeon = 'RDM';
    intents.push('Surgeon RDM');
  } else if (/\b(?:surgeon\s+)?ci\b/i.test(lower)) {
    result.surgeon = 'CI';
    intents.push('Surgeon CI');
  } else if (/\b(?:surgeon\s+)?oak\b/i.test(lower)) {
    result.surgeon = 'OAK';
    intents.push('Surgeon OAK');
  }

  // 2. Gleason Score Detection
  const gleasonMatch = lower.match(/\b([3-5])\s*\+\s*([3-5])\b/);
  if (gleasonMatch) {
    const gleason = `${gleasonMatch[1]}+${gleasonMatch[2]}` as GleasonGrade;
    result.gleasonGrade = gleason;
    intents.push(`Gleason ${gleason}`);
  }

  // 3. Stage Detection (Pathological vs Clinical)
  const pStageMatch = lower.match(/\bpt([1-4][a-c]?)\b/i) || lower.match(/\bstage\s+([2-4][a-c]?)\b/i);
  if (pStageMatch) {
    const rawStage = pStageMatch[1].toUpperCase();
    const cleanStage = (rawStage.startsWith('T') ? rawStage.slice(1) : rawStage) as PathologicalStage;
    result.pathologicalStage = cleanStage;
    intents.push(`pT${cleanStage}`);
  }

  const cStageMatch = lower.match(/\bct([1-4][a-c]?)\b/i);
  if (cStageMatch) {
    const rawStage = cStageMatch[1].toUpperCase();
    const cleanStage = (rawStage.startsWith('T') ? rawStage.slice(1) : rawStage) as ClinicalStage;
    result.clinicalStage = cleanStage;
    intents.push(`cT${cleanStage}`);
  }

  // 4. Margins
  if (/\br1\b|\bpositive\s*margins?\b/i.test(lower)) {
    result.marginStatus = 'Positive (R1)';
    intents.push('Positive Margin (R1)');
  } else if (/\br0\b|\bnegative\s*margins?\b/i.test(lower)) {
    result.marginStatus = 'Negative (R0)';
    intents.push('Negative Margin (R0)');
  }

  // 5. Nerve Sparing
  if (/\bbilateral\b/i.test(lower)) {
    result.nerveSparing = 'Bilateral';
    intents.push('Bilateral Nerve Sparing');
  } else if (/\bleft\s*nerve\s*sparing\b/i.test(lower)) {
    result.nerveSparing = 'Left';
    intents.push('Left Nerve Sparing');
  } else if (/\bright\s*nerve\s*sparing\b/i.test(lower)) {
    result.nerveSparing = 'Right';
    intents.push('Right Nerve Sparing');
  } else if (/\bnon[- ]?nerve\s*sparing\b|\bno\s*nerve\s*sparing\b/i.test(lower)) {
    result.nerveSparing = 'None';
    intents.push('Non-Nerve Sparing');
  }

  // 6. PSA Thresholds
  const psaGreaterMatch = lower.match(/psa\s*(?:>|>=|greater\s+than|above|over)\s*(\d+(?:\.\d+)?)/i);
  if (psaGreaterMatch) {
    result.psaMin = parseFloat(psaGreaterMatch[1]);
    intents.push(`PSA > ${result.psaMin} ng/mL`);
  }

  const psaLessMatch = lower.match(/psa\s*(?:<|<=|less\s+than|below|under)\s*(\d+(?:\.\d+)?)/i);
  if (psaLessMatch) {
    result.psaMax = parseFloat(psaLessMatch[1]);
    intents.push(`PSA < ${result.psaMax} ng/mL`);
  }

  // 7. Age Filters
  const ageLessMatch = lower.match(/age\s*(?:<|under|younger\s+than)\s*(\d+)/i) || lower.match(/under\s+(\d+)\s*(?:years?\s*old|y\/o)/i);
  if (ageLessMatch) {
    result.ageMax = parseInt(ageLessMatch[1], 10);
    intents.push(`Age < ${result.ageMax}`);
  }

  const ageGreaterMatch = lower.match(/age\s*(?:>|over|older\s+than)\s*(\d+)/i) || lower.match(/over\s+(\d+)\s*(?:years?\s*old|y\/o)/i);
  if (ageGreaterMatch) {
    result.ageMin = parseInt(ageGreaterMatch[1], 10);
    intents.push(`Age > ${result.ageMin}`);
  }

  // 8. BCR / Rising PSA
  if (/\bbcr\b|\bbiochemical\s*recurrence\b|\brising\s*psa\b|\bpsa\s*bounce\b/i.test(lower)) {
    result.hasBcrAlert = true;
    intents.push('Biochemical Recurrence (PSA ≥ 0.2)');
  }

  // 9. Continence / PROMs
  if (/\bpad[- ]free\b|\b0\s*pads?\b|\bcontinent\b|\bcompletely\s*dry\b/i.test(lower)) {
    result.isPadFree = true;
    intents.push('Pad-free Continence');
  }

  // 10. Follow-up status & Milestones
  if (/\boverdue\b|\bmissed\s*follow\s*up/i.test(lower)) {
    result.hasOverdueFollowUp = true;
    intents.push('Overdue Follow-up Alert');
  }

  const milestoneMatch = lower.match(/\b(2|6|12|18|24|30|36)\s*m(?:onths?)?\b/i);
  if (milestoneMatch) {
    result.milestone = `${milestoneMatch[1]}m` as FollowUpMilestone;
    intents.push(`${milestoneMatch[1]} Month Milestone`);
  }

  return result;
}
