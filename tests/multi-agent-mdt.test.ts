import { describe, it, expect } from 'vitest';
import { runMultiAgentMDTSimulation } from '@/lib/ai/multi-agent-mdt';
import { PatientFullRecord } from '@/types/patient';

const MOCK_HIGH_RISK_PATIENT: PatientFullRecord = {
  id: 'pt-mdt-1',
  firstName: 'Arthur',
  surname: 'Pendleton',
  dateOfBirth: '1958-03-14',
  age: 66,
  nhsNumber: '900 111 2222',
  hospitalNumber: 'RALP-MDT-01',
  primarySurgeon: 'VK',
  status: 'Active',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  completeness: { score: 100, baselineComplete: true, operationComplete: true, histologyComplete: true, followUpsComplete: 3, totalFollowUpsExpected: 7, missingFields: [] },
  baseline: {
    patientId: 'pt-mdt-1',
    psa: 18.5,
    gleasonGrade: '4+4',
    gradeGroup: 4,
    clinicalStage: '3A',
    percentPositiveCoresWorst: 80,
    percentPositiveCoresBest: 30,
    ukbScore: 85,
    updatedAt: '2024-01-01',
  },
  operation: {
    patientId: 'pt-mdt-1',
    operationDate: '2024-02-10',
    surgeon: 'VK',
    nerveSparing: 'Left',
    leftNerveSparingGrade: '4/5',
    rightNerveSparingGrade: 'N/A',
    sphincter: 'Good',
    anteriorReconstruction: 'Good',
    lymphNodeDissection: true,
    bloodLossMl: 220,
    durationMinutes: 150,
    bladderNeck: 'sparing',
    updatedAt: '2024-02-10',
  },
  histology: {
    patientId: 'pt-mdt-1',
    reportDate: '2024-02-25',
    gleasonGrade: '4+5',
    gradeGroup: 5,
    pathologicalStage: '3B',
    surgicalMargins: 'Positive (R1)',
    positiveMarginLocations: ['Apical', 'Posterolateral'],
    extraprostaticExtension: true,
    seminalVesicleInvasion: true,
    lymphovascularInvasion: false,
    updatedAt: '2024-02-25',
  },
  followUps: [
    { id: 'fu-1', patientId: 'pt-mdt-1', milestone: '2m', targetMonths: 2, dueDate: '2024-04-10', promSubmitted: true, status: 'completed', psa: 0.05 },
    { id: 'fu-2', patientId: 'pt-mdt-1', milestone: '6m', targetMonths: 6, dueDate: '2024-08-10', promSubmitted: true, status: 'completed', psa: 0.35, biochemicalRecurrence: true },
  ],
  proms: [],
};

describe('Multi-Agent MDT Clinical Decision Simulator', () => {
  it('runs multi-agent simulation and produces consensus decision with 3 specialist agents', () => {
    const report = runMultiAgentMDTSimulation(MOCK_HIGH_RISK_PATIENT);

    expect(report.patientName).toBe('Arthur Pendleton');
    expect(report.agents).toHaveLength(3);

    // Agent 1: Surgeon
    const surgeon = report.agents.find((a) => a.role.includes('Surgeon'));
    expect(surgeon).toBeDefined();
    expect(surgeon?.keyFindings.some((f) => f.includes('Left'))).toBe(true);

    // Agent 2: Pathologist
    const pathologist = report.agents.find((a) => a.role.includes('Histopathologist'));
    expect(pathologist).toBeDefined();
    expect(pathologist?.severity).toBe('critical'); // SVI present
    expect(pathologist?.keyFindings.some((f) => f.includes('pT3B') || f.includes('pT3b'))).toBe(true);

    // Agent 3: Oncologist
    const oncologist = report.agents.find((a) => a.role.includes('Oncologist'));
    expect(oncologist).toBeDefined();
    expect(oncologist?.severity).toBe('critical'); // PSA 0.35 >= 0.2
    expect(oncologist?.recommendations.some((r) => r.includes('Salvage Radiotherapy'))).toBe(true);

    // Overall Consensus
    expect(report.overallMDTDecision.toLowerCase()).toContain('biochemical');
    expect(report.officialLetterText).toContain('OXFORD UNIVERSITY HOSPITALS NHS FOUNDATION TRUST');
    expect(report.officialLetterText).toContain('MULTIDISCIPLINARY TEAM (MDT) CLINICAL DECISION RECORD');
  });
});
