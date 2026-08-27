import { db } from '@/lib/api-client';
import { FollowUpRecord } from '@/types/follow-up';

export const followUpMutations = {
  updateFollowUp: (patientId: string, record: FollowUpRecord) => db.updateFollowUp(patientId, record),
};
