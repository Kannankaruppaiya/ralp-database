import React, { Suspense } from 'react';
import ClinicSummaryPage from '../clinic-summary/page';

export default function PrintPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-muted-foreground">Preparing print document...</div>}>
      <ClinicSummaryPage />
    </Suspense>
  );
}
