import { describe, it, expect } from 'vitest';
import { extractClinicalDocument } from '@/lib/ai/document-extractor';

const SAMPLE_OP_NOTE = `
OXFORD UNIVERSITY HOSPITALS NHS FOUNDATION TRUST
DEPARTMENT OF UROLOGICAL SURGERY

OPERATIVE RECORD: ROBOT-ASSISTED RADICAL PROSTATECTOMY (RALP)
Patient Name: John Smith
NHS Number: 900 123 4567
Hospital No: RALP-OX-99
Date of Operation: 2024-03-15
Lead Surgeon: Mr. Vivek Kannan (VK)

PRE-OPERATIVE CLINICAL BASELINE:
Baseline PSA: 15.8 ng/mL
Gleason Score: 4+3 (Grade Group 3)
Clinical Stage: T3a

OPERATIVE TECHNIQUE:
Patient placed in steep Trendelenburg position. 6-port transperitoneal robotic access.
Prostate mobilized. Bilateral nerve sparing successfully performed with preservation of neurovascular bundles.
Bladder neck reconstruction with continuous 3-0 V-Loc barbed suture.
Lymph node dissection completed.
Estimated Blood Loss (EBL): 180 mL.
Console duration: 135 minutes.

HISTOLOGY / SPECIMEN REPORT:
Pathological Stage: pT3b
Gleason Grade: 4+3
Surgical Margins: Positive (R1) at Apical margin and Posterolateral zone.
Extraprostatic extension: Present.
Seminal vesicle invasion: Present.
`.trim();

describe('Multimodal Document & Op-Note Extraction Engine', () => {
  it('correctly classifies document type and extracts clinical entities with confidence', () => {
    const extracted = extractClinicalDocument(SAMPLE_OP_NOTE);

    // Classification
    expect(extracted.documentType).toBe('Operation Note');

    // Demographics
    expect(extracted.patientDetails.firstName.value).toBe('John');
    expect(extracted.patientDetails.surname.value).toBe('Smith');
    expect(extracted.patientDetails.nhsNumber.value).toBe('9001234567');
    expect(extracted.patientDetails.hospitalNumber.value).toBe('RALP-OX-99');

    // Baseline Cancer
    expect(extracted.baselineCancer?.psa.value).toBe(15.8);
    expect(extracted.baselineCancer?.gleasonGrade.value).toBe('4+3');
    expect(extracted.baselineCancer?.gradeGroup.value).toBe(3);

    // Operative parameters
    expect(extracted.operationData?.surgeon.value).toBe('VK');
    expect(extracted.operationData?.nerveSparing.value).toBe('Bilateral');

    // Histology
    expect(extracted.histologyData?.pathologicalStage.value).toBe('3B');
    expect(extracted.histologyData?.surgicalMargins.value).toBe('Positive (R1)');
    expect(extracted.histologyData?.positiveMarginLocations.value).toContain('Apical');
    expect(extracted.histologyData?.positiveMarginLocations.value).toContain('Posterolateral');
    expect(extracted.histologyData?.extraprostaticExtension.value).toBe(true);
    expect(extracted.histologyData?.seminalVesicleInvasion.value).toBe(true);
  });
});
