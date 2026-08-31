import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { DocumentUpload } from '@/components/ingestion/document-upload';

export default function DocumentUploadPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Upload Theatre Notes & Clinic Letters"
        description="Ingest Word documents (.docx) or Google Forms responses to extract RALP surgical parameters and baseline oncological data"
        breadcrumbs={[
          { label: 'Data Ingestion', href: '/data-ingestion' },
          { label: 'Upload' },
        ]}
      />
      <DocumentUpload />
    </div>
  );
}
