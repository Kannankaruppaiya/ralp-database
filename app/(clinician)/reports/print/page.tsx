'use client';

import React, { Suspense } from 'react';
import ClinicSummaryPage from '../clinic-summary/page';

export default function PrintPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Preparing print document…</div>}>
      <ClinicSummaryPage />
    </Suspense>
  );
}
