'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IngestionJob, ExtractedField } from '@/types/ingestion';
import { FileUp, FileText, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, UploadCloud } from 'lucide-react';
import { db } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

export function DocumentUpload() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<'theatre_note' | 'clinic_letter' | 'google_form_csv'>('theatre_note');

  const handleSimulatedUpload = (sampleName: string) => {
    setIsUploading(true);
    setTimeout(() => {
      const newJob: IngestionJob = {
        id: `job-${Date.now()}`,
        documentId: `doc-${Date.now()}`,
        documentTitle: sampleName,
        sourceType: selectedDocType === 'theatre_note' ? 'theatre_note' : selectedDocType === 'clinic_letter' ? 'clinic_letter' : 'google_form_csv',
        status: 'review_required',
        conflictCount: 1,
        uploadedAt: new Date().toISOString(),
        matchedPatient: {
          patientId: 'pat-001',
          fullName: 'Arthur Pendleton',
          nhsNumber: '482 910 3341',
          hospitalNumber: 'RALP-78201',
          dob: '1961-04-14',
          matchScore: 98,
          matchReasons: ['Matched NHS Number: 482 910 3341', 'Surname: Pendleton'],
        },
        candidateMatches: [],
        extractedFields: [
          {
            id: `f-${Date.now()}-1`,
            fieldKey: 'primarySurgeon',
            fieldLabel: 'Primary Surgeon',
            category: 'Operation',
            rawValue: 'Surgeon: VK',
            normalizedValue: 'VK',
            confidence: 99,
            status: 'exact',
            hasConflict: false,
          },
          {
            id: `f-${Date.now()}-2`,
            fieldKey: 'bladderNeck',
            fieldLabel: 'Bladder Neck',
            category: 'Operation',
            rawValue: 'Bladder neck: Sparing technique',
            normalizedValue: 'sparing',
            confidence: 96,
            status: 'exact',
            hasConflict: false,
          },
          {
            id: `f-${Date.now()}-3`,
            fieldKey: 'nerveSparing',
            fieldLabel: 'Nerve Sparing',
            category: 'Operation',
            rawValue: 'Nerve sparing: Bilateral (L: 5/5, R: 4/5)',
            normalizedValue: 'Bilateral',
            confidence: 97,
            status: 'exact',
            hasConflict: false,
          },
          {
            id: `f-${Date.now()}-4`,
            fieldKey: 'bloodLossMl',
            fieldLabel: 'Estimated Blood Loss',
            category: 'Operation',
            rawValue: 'EBL: 250ml',
            normalizedValue: 250,
            confidence: 92,
            status: 'exact',
            hasConflict: false,
          },
        ],
      };

      db.saveIngestionJob(newJob);
      setIsUploading(false);
      router.push('/data-ingestion/extraction-review');
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-8 text-center transition-colors hover:border-teal-500 hover:bg-teal-50/20 dark:border-slate-800 dark:bg-slate-900/50"
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleSimulatedUpload('Uploaded_RALP_Theatre_Note.docx');
        }}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 shadow-sm mb-4">
          <UploadCloud className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Upload Clinical Documents for AI & Regex Parsing
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
          Supports Theatre Operation Notes (.docx, Word), Clinic Follow-up Letters (.pdf / .docx), and Google Form exports (.csv / .xlsx).
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            disabled={isUploading}
            onClick={() => handleSimulatedUpload('RALP_Theatre_OpNote_Sample.docx')}
            className="gap-2"
          >
            {isUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            <span>Upload Theatre Note (.docx)</span>
          </Button>

          <Button
            variant="outline"
            disabled={isUploading}
            onClick={() => handleSimulatedUpload('Histology_Clinic_Letter_Sample.docx')}
            className="gap-2"
          >
            <FileText className="h-4 w-4 text-purple-600" />
            <span>Upload Clinic Follow-up Letter</span>
          </Button>

          <Button
            variant="outline"
            disabled={isUploading}
            onClick={() => handleSimulatedUpload('Google_Forms_Patient_Responses.csv')}
            className="gap-2"
          >
            <FileText className="h-4 w-4 text-cyan-600" />
            <span>Import Google Forms CSV</span>
          </Button>
        </div>
      </div>

      {/* Preset Documents Quick Test */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Automated Ingestion Protocol Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            • <strong>Theatre Operation Notes</strong> automatically parse: Primary Surgeon (VK, RDM, CI, OAK), Bladder Neck preservation status, Nerve Sparing grades (2/5 to 5/5), Sphincter quality, Anterior reconstruction, and Blood loss.
          </p>
          <p>
            • <strong>Follow-up Clinic Letters</strong> automatically parse: Post-op PSA levels, Histology Gleason score and Grade Group, Margin status (R0/R1), and Pathological stage (pT2A - pT4).
          </p>
          <p>
            • <strong>Conflict Prevention</strong>: Any discrepancy between extracted and database values triggers a side-by-side verification modal before committing to the registry.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function DataSourceCard() {
  return null;
}

export function DocumentCard() {
  return null;
}

export function ProcessingStatus() {
  return null;
}
