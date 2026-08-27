'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/api-client';
import { ClinicalDocument } from '@/types/document';

export function useDocuments(patientId: string) {
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    let active = true;
    db.getDocuments(patientId)
      .then((d) => active && setDocuments(d))
      .catch(() => active && setDocuments([]))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [patientId]);

  return { documents, isLoading };
}
