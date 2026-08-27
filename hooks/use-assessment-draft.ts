'use client';

import { useCallback, useEffect, useState } from 'react';
import { IPSSAnswers, IPSSScore, SHIMAnswers, SHIMScore, ContinenceData } from '@/types/prom';

export interface AssessmentDraft {
  ipssAnswers?: IPSSAnswers;
  ipssScore?: IPSSScore;
  shimAnswers?: SHIMAnswers;
  shimScore?: SHIMScore;
  continence?: ContinenceData;
}

const KEY = 'ralp_assessment_draft';

/**
 * Holds the three questionnaire steps until the patient confirms on the review
 * screen, so one completed assessment becomes one submission. Writing each step
 * straight to the database would leave a half-finished questionnaire in the
 * record if the patient stopped partway.
 *
 * sessionStorage, not the database: an unsubmitted draft is not clinical data,
 * and it should not outlive the tab.
 */
export function useAssessmentDraft() {
  const [draft, setDraft] = useState<AssessmentDraft>({});

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(KEY);
      if (stored) setDraft(JSON.parse(stored));
    } catch {
      // private mode or blocked storage — start from an empty draft
    }
  }, []);

  const update = useCallback((patch: AssessmentDraft) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      try {
        sessionStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // draft is kept in memory for this page even if storage is unavailable
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setDraft({});
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // nothing to clean up
    }
  }, []);

  return { draft, update, clear };
}
