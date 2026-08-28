import { PatientFullRecord } from '@/types/patient';
import { tokenizeMedicalText, buildDocumentVector, TokenizedDocument } from './medical-tokenizer';
import { parseClinicalQuery, ParsedClinicalQuery } from './clinical-query-parser';

export interface SearchResultItem {
  patient: PatientFullRecord;
  score: number; // 0 - 100
  matchReasons: string[];
  matchedKeywords: string[];
}

export interface SearchResponse {
  query: string;
  parsedQuery: ParsedClinicalQuery;
  totalMatches: number;
  results: SearchResultItem[];
  executionTimeMs: number;
}

/**
 * Serializes a full patient record into a rich medical corpus string for indexing.
 */
export function serializePatientRecord(p: PatientFullRecord): string {
  const parts: string[] = [];

  // Demographics
  parts.push(`Patient: ${p.firstName} ${p.surname}`);
  parts.push(`NHS: ${p.nhsNumber} MRN: ${p.hospitalNumber}`);
  parts.push(`Age: ${p.age} years old (DOB: ${p.dateOfBirth})`);
  parts.push(`Primary Surgeon: ${p.primarySurgeon} ${p.otherSurgeonName ?? ''}`);
  parts.push(`Status: ${p.status}`);

  // Baseline
  if (p.baseline) {
    parts.push(`Pre-Op Baseline PSA: ${p.baseline.psa} ng/mL`);
    parts.push(`Biopsy Gleason: ${p.baseline.gleasonGrade} (Grade Group ${p.baseline.gradeGroup})`);
    parts.push(`Clinical Stage: cT${p.baseline.clinicalStage}`);
    if (p.baseline.mriPIRADS) parts.push(`MRI PI-RADS: ${p.baseline.mriPIRADS}`);
    if (p.baseline.notes) parts.push(`Baseline Notes: ${p.baseline.notes}`);
  }

  // Operation
  if (p.operation) {
    parts.push(`Operation: Robot-Assisted Laparoscopic Prostatectomy (RALP) on ${p.operation.operationDate}`);
    parts.push(`Surgeon: ${p.operation.surgeon}`);
    parts.push(`Nerve Sparing: ${p.operation.nerveSparing}`);
    if (p.operation.rightNerveSparingGrade) parts.push(`Right NS Grade: ${p.operation.rightNerveSparingGrade}`);
    if (p.operation.leftNerveSparingGrade) parts.push(`Left NS Grade: ${p.operation.leftNerveSparingGrade}`);
    parts.push(`Bladder Neck: ${p.operation.bladderNeck}`);
    parts.push(`Sphincter Reconstruction: ${p.operation.sphincter}`);
    if (p.operation.notes) parts.push(`Theatre Notes: ${p.operation.notes}`);
  }

  // Histology
  if (p.histology) {
    parts.push(`Post-Op Histology Pathological Stage: pT${p.histology.pathologicalStage}`);
    parts.push(`Specimen Gleason: ${p.histology.gleasonGrade} (Grade Group ${p.histology.gradeGroup})`);
    parts.push(`Surgical Margins: ${p.histology.surgicalMargins}`);
    if (p.histology.positiveMarginLocations?.length) {
      parts.push(`Margin Locations: ${p.histology.positiveMarginLocations.join(', ')}`);
    }
    if (p.histology.marginLengthMm) parts.push(`Margin Length: ${p.histology.marginLengthMm} mm`);
    if (p.histology.extraprostaticExtension) parts.push(`Extraprostatic Extension (EPE): Present`);
    if (p.histology.seminalVesicleInvasion) parts.push(`Seminal Vesicle Invasion (SVI): Present`);
    if (p.histology.notes) parts.push(`Pathology Notes: ${p.histology.notes}`);
  }

  // Follow-ups & PROMs
  if (p.followUps?.length) {
    for (const fu of p.followUps) {
      parts.push(`Follow-up ${fu.milestone} (${fu.targetMonths}m): Status ${fu.status}, PSA ${fu.psa ?? 'pending'}`);
      if (fu.biochemicalRecurrence || (fu.psa !== undefined && fu.psa >= 0.2)) {
        parts.push(`Biochemical Recurrence (BCR) Alert at ${fu.milestone}`);
      }
      if (fu.continence?.dayStatus) {
        parts.push(`Continence at ${fu.milestone}: ${fu.continence.dayStatus}`);
      }
      if (fu.shimScore?.severity) {
        parts.push(`Erectile Function at ${fu.milestone}: ${fu.shimScore.severity}`);
      }
    }
  }

  return parts.join('\n');
}

/**
 * In-Memory BM25 Indexer & Clinical Search Engine.
 */
export class ClinicalSearchEngine {
  private documents: Map<string, { patient: PatientFullRecord; doc: TokenizedDocument }> = new Map();
  private invertedIndex: Map<string, Set<string>> = new Map();
  private avgDocLength = 0;
  private totalDocs = 0;

  // BM25 parameters
  private readonly k1 = 1.2;
  private readonly b = 0.75;

  constructor(patients: PatientFullRecord[] = []) {
    this.indexPatients(patients);
  }

  public indexPatients(patients: PatientFullRecord[]): void {
    this.documents.clear();
    this.invertedIndex.clear();
    let totalLength = 0;

    for (const p of patients) {
      const text = serializePatientRecord(p);
      const doc = buildDocumentVector(text);
      this.documents.set(p.id, { patient: p, doc });

      totalLength += doc.totalTerms;

      for (const term of doc.terms.keys()) {
        if (!this.invertedIndex.has(term)) {
          this.invertedIndex.set(term, new Set());
        }
        this.invertedIndex.get(term)!.add(p.id);
      }
    }

    this.totalDocs = patients.length;
    this.avgDocLength = this.totalDocs > 0 ? totalLength / this.totalDocs : 0;
  }

  /**
   * Evaluates query using BM25 and structured clinical filters.
   */
  public search(query: string, limit = 20): SearchResponse {
    const startTime = performance.now();
    const parsedQuery = parseClinicalQuery(query);
    const queryTokens = tokenizeMedicalText(query);

    if (queryTokens.length === 0 && !parsedQuery.surgeon && !parsedQuery.pathologicalStage) {
      return {
        query,
        parsedQuery,
        totalMatches: 0,
        results: [],
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    const scoredResults: SearchResultItem[] = [];

    for (const [id, { patient, doc }] of this.documents.entries()) {
      let bm25Score = 0;
      const matchReasons: string[] = [];
      const matchedKeywords: string[] = [];

      // --- 1. Compute BM25 Lexical Score ---
      for (const token of queryTokens) {
        const tf = doc.terms.get(token) ?? 0;
        if (tf > 0) {
          matchedKeywords.push(token);
          const docCountWithTerm = this.invertedIndex.get(token)?.size ?? 0;
          // BM25 Inverse Document Frequency
          const idf = Math.log(
            (this.totalDocs - docCountWithTerm + 0.5) / (docCountWithTerm + 0.5) + 1
          );

          // BM25 term saturation
          const numerator = tf * (this.k1 + 1);
          const denominator =
            tf + this.k1 * (1 - this.b + this.b * (doc.totalTerms / (this.avgDocLength || 1)));

          bm25Score += idf * (numerator / denominator);
        }
      }

      // --- 2. Evaluate Structured Clinical Constraint Bonuses ---
      let clinicalBonus = 0;

      // Surgeon match
      if (parsedQuery.surgeon) {
        if (patient.primarySurgeon === parsedQuery.surgeon) {
          clinicalBonus += 25;
          matchReasons.push(`Primary Surgeon: ${parsedQuery.surgeon}`);
        } else {
          // Hard mismatch penalty if explicitly requested
          clinicalBonus -= 30;
        }
      }

      // Pathological stage match
      if (parsedQuery.pathologicalStage) {
        if (patient.histology?.pathologicalStage === parsedQuery.pathologicalStage) {
          clinicalBonus += 35;
          matchReasons.push(`pT Stage: pT${parsedQuery.pathologicalStage}`);
        } else if (patient.baseline?.clinicalStage === parsedQuery.pathologicalStage) {
          clinicalBonus += 20;
          matchReasons.push(`cT Stage: cT${parsedQuery.pathologicalStage}`);
        }
      }

      // Gleason grade match
      if (parsedQuery.gleasonGrade) {
        if (
          patient.histology?.gleasonGrade === parsedQuery.gleasonGrade ||
          patient.baseline?.gleasonGrade === parsedQuery.gleasonGrade
        ) {
          clinicalBonus += 30;
          matchReasons.push(`Gleason Score: ${parsedQuery.gleasonGrade}`);
        }
      }

      // Margin match
      if (parsedQuery.marginStatus) {
        if (patient.histology?.surgicalMargins === parsedQuery.marginStatus) {
          clinicalBonus += 30;
          matchReasons.push(`Margin: ${parsedQuery.marginStatus}`);
        }
      }

      // Nerve sparing match
      if (parsedQuery.nerveSparing) {
        if (patient.operation?.nerveSparing === parsedQuery.nerveSparing) {
          clinicalBonus += 25;
          matchReasons.push(`Nerve Sparing: ${parsedQuery.nerveSparing}`);
        }
      }

      // PSA threshold match
      if (parsedQuery.psaMin !== undefined) {
        const currentPsa = patient.baseline?.psa ?? 0;
        if (currentPsa >= parsedQuery.psaMin) {
          clinicalBonus += 20;
          matchReasons.push(`Pre-op PSA ${currentPsa} ≥ ${parsedQuery.psaMin} ng/mL`);
        }
      }

      if (parsedQuery.psaMax !== undefined) {
        const currentPsa = patient.baseline?.psa ?? 0;
        if (currentPsa > 0 && currentPsa <= parsedQuery.psaMax) {
          clinicalBonus += 20;
          matchReasons.push(`Pre-op PSA ${currentPsa} ≤ ${parsedQuery.psaMax} ng/mL`);
        }
      }

      // Biochemical Recurrence match
      if (parsedQuery.hasBcrAlert) {
        const hasBcr = patient.followUps?.some((f) => f.biochemicalRecurrence || (f.psa !== undefined && f.psa >= 0.2));
        if (hasBcr) {
          clinicalBonus += 40;
          matchReasons.push('Biochemical Recurrence (PSA ≥ 0.2 ng/mL)');
        }
      }

      // Pad-free continence match
      if (parsedQuery.isPadFree) {
        const isDry =
          patient.followUps?.some((f) => f.continence?.dayStatus?.includes('no pad')) ||
          patient.proms?.some((pr) => pr.continence?.dayStatus?.includes('no pad'));
        if (isDry) {
          clinicalBonus += 25;
          matchReasons.push('Pad-free continence achieved');
        }
      }

      // Overdue Follow-up match
      if (parsedQuery.hasOverdueFollowUp) {
        const hasOverdue = patient.followUps?.some((f) => f.status === 'overdue');
        if (hasOverdue) {
          clinicalBonus += 30;
          matchReasons.push('Overdue Milestone Follow-up');
        }
      }

      // Final hybrid score
      const rawTotalScore = bm25Score * 10 + clinicalBonus;

      if (rawTotalScore > 5 || (clinicalBonus > 0 && rawTotalScore > 0)) {
        const normalizedScore = Math.min(99, Math.max(15, Math.round(rawTotalScore)));
        scoredResults.push({
          patient,
          score: normalizedScore,
          matchReasons: Array.from(new Set(matchReasons)),
          matchedKeywords: Array.from(new Set(matchedKeywords)),
        });
      }
    }

    // Sort descending by score
    scoredResults.sort((a, b) => b.score - a.score);

    const finalResults = scoredResults.slice(0, limit);
    const executionTimeMs = Math.round(performance.now() - startTime);

    return {
      query,
      parsedQuery,
      totalMatches: scoredResults.length,
      results: finalResults,
      executionTimeMs,
    };
  }
}
