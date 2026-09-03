import { describe, it, expect } from 'vitest';
import { tokenizeMedicalText } from '@/lib/ai/medical-tokenizer';
import { parseClinicalQuery } from '@/lib/ai/clinical-query-parser';
import { ClinicalSearchEngine } from '@/lib/ai/search-engine';
import { synthesizeClinicalRAG } from '@/lib/ai/rag-synthesizer';
import { PatientFullRecord } from '@/types/patient';

const MOCK_PATIENTS: PatientFullRecord[] = [
  {
    id: 'p1',
    firstName: 'John',
    surname: 'Smith',
    dateOfBirth: '1960-05-12',
    age: 64,
    nhsNumber: '900 000 0001',
    hospitalNumber: 'RALP-001',
    primarySurgeon: 'VK',
    status: 'Active',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    completeness: { score: 95, baselineComplete: true, operationComplete: true, histologyComplete: true, followUpsComplete: 3, totalFollowUpsExpected: 7, missingFields: [] },
    baseline: {
      patientId: 'p1',
      psa: 14.2,
      gleasonGrade: '4+3',
      gradeGroup: 3,
      clinicalStage: '2C',
      percentPositiveCoresWorst: 60,
      percentPositiveCoresBest: 20,
      ukbScore: 75,
      updatedAt: '2024-01-01',
    },
    operation: {
      patientId: 'p1',
      operationDate: '2024-02-01',
      surgeon: 'VK',
      nerveSparing: 'Bilateral',
      leftNerveSparingGrade: '5/5',
      rightNerveSparingGrade: '5/5',
      sphincter: 'Excellent',
      anteriorReconstruction: 'Excellent',
      lymphNodeDissection: true,
      bloodLossMl: 250,
      durationMinutes: 140,
      bladderNeck: 'sparing',
      updatedAt: '2024-02-01',
    },
    histology: {
      patientId: 'p1',
      reportDate: '2024-02-15',
      gleasonGrade: '4+3',
      gradeGroup: 3,
      pathologicalStage: '3B',
      surgicalMargins: 'Positive (R1)',
      positiveMarginLocations: ['Apical'],
      extraprostaticExtension: true,
      seminalVesicleInvasion: true,
      lymphovascularInvasion: false,
      updatedAt: '2024-02-15',
    },
    followUps: [
      { id: 'f1', patientId: 'p1', milestone: '2m', targetMonths: 2, dueDate: '2024-04-01', promSubmitted: true, status: 'completed', psa: 0.01 },
      { id: 'f2', patientId: 'p1', milestone: '6m', targetMonths: 6, dueDate: '2024-08-01', promSubmitted: true, status: 'completed', psa: 0.25, biochemicalRecurrence: true },
    ],
    proms: [],
  },
  {
    id: 'p2',
    firstName: 'David',
    surname: 'Brown',
    dateOfBirth: '1970-08-20',
    age: 54,
    nhsNumber: '900 000 0002',
    hospitalNumber: 'RALP-002',
    primarySurgeon: 'RDM',
    status: 'Active',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    completeness: { score: 90, baselineComplete: true, operationComplete: true, histologyComplete: true, followUpsComplete: 2, totalFollowUpsExpected: 7, missingFields: [] },
    baseline: {
      patientId: 'p2',
      psa: 6.5,
      gleasonGrade: '3+4',
      gradeGroup: 2,
      clinicalStage: '2A',
      percentPositiveCoresWorst: 30,
      percentPositiveCoresBest: 10,
      ukbScore: 45,
      updatedAt: '2024-01-01',
    },
    operation: {
      patientId: 'p2',
      operationDate: '2024-03-01',
      surgeon: 'RDM',
      nerveSparing: 'None',
      leftNerveSparingGrade: 'N/A',
      rightNerveSparingGrade: 'N/A',
      sphincter: 'Good',
      anteriorReconstruction: 'Good',
      lymphNodeDissection: false,
      bloodLossMl: 300,
      durationMinutes: 160,
      bladderNeck: 'sparing',
      updatedAt: '2024-03-01',
    },
    histology: {
      patientId: 'p2',
      reportDate: '2024-03-15',
      gleasonGrade: '3+4',
      gradeGroup: 2,
      pathologicalStage: '2A',
      surgicalMargins: 'Negative (R0)',
      extraprostaticExtension: false,
      seminalVesicleInvasion: false,
      lymphovascularInvasion: false,
      updatedAt: '2024-03-15',
    },
    followUps: [
      { id: 'f3', patientId: 'p2', milestone: '2m', targetMonths: 2, dueDate: '2024-05-01', promSubmitted: true, status: 'completed', psa: 0.01, continence: { dayStatus: 'Completely dry, no pad', nightPads: 0 } },
    ],
    proms: [],
  },
];

describe('Medical Tokenizer', () => {
  it('tokenizes compound medical entities correctly', () => {
    const tokens = tokenizeMedicalText('Patient with pT3b stage, Gleason 4+3 and R1 positive margin under Surgeon VK');
    expect(tokens).toContain('4+3');
    expect(tokens).toContain('gleason_4+3');
    expect(tokens).toContain('pt3b');
    expect(tokens).toContain('r1');
    expect(tokens).toContain('positive_margin');
    expect(tokens).toContain('surgeon_vk');
  });

  it('recognizes continence and recurrence tokens', () => {
    const tokens = tokenizeMedicalText('Patient is pad-free with rising PSA BCR alert');
    expect(tokens).toContain('pad_free');
    expect(tokens).toContain('continent');
    expect(tokens).toContain('bcr_recurrence');
  });
});

describe('Clinical Query Parser', () => {
  it('extracts structured constraints from natural language', () => {
    const parsed = parseClinicalQuery('pT3b positive margins under Surgeon VK with PSA > 10');
    expect(parsed.pathologicalStage).toBe('3B');
    expect(parsed.marginStatus).toBe('Positive (R1)');
    expect(parsed.surgeon).toBe('VK');
    expect(parsed.psaMin).toBe(10);
    expect(parsed.extractedIntents).toContain('pT3B');
    expect(parsed.extractedIntents).toContain('Positive Margin (R1)');
    expect(parsed.extractedIntents).toContain('Surgeon VK');
    expect(parsed.extractedIntents).toContain('PSA > 10 ng/mL');
  });
});

describe('Clinical Search Engine & RAG', () => {
  const engine = new ClinicalSearchEngine(MOCK_PATIENTS);

  it('ranks high-match patient highest based on oncological criteria', () => {
    const res = engine.search('pT3b positive margins Surgeon VK');
    expect(res.results.length).toBeGreaterThan(0);
    expect(res.results[0].patient.id).toBe('p1');
    expect(res.results[0].score).toBeGreaterThan(50);
    expect(res.results[0].matchReasons).toContain('Primary Surgeon: VK');
    expect(res.results[0].matchReasons).toContain('pT Stage: pT3B');
    expect(res.results[0].matchReasons).toContain('Margin: Positive (R1)');
  });

  it('synthesizes clinical RAG summary with accurate aggregate metrics', () => {
    const searchRes = engine.search('pT3b');
    const rag = synthesizeClinicalRAG(searchRes);

    expect(rag.keyMetrics.matchedCohortSize).toBe(1);
    expect(rag.keyMetrics.meanPsa).toBe(14.2);
    expect(rag.keyMetrics.positiveMarginRatePercent).toBe(100);
    expect(rag.keyMetrics.bcrAlertCount).toBe(1);
    expect(rag.clinicalFindings.length).toBeGreaterThan(0);
    expect(rag.actionableInsights.length).toBeGreaterThan(0);
  });
});
