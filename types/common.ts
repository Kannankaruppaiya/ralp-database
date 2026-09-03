/** A surgeon's initials. Open set — the roster lives in the database, not here.
 *  See supabase/migrations/0012_surgeon_roster.sql. */
export type SurgeonCode = string;

export type RiskCategory = 'Low' | 'Favourable Intermediate' | 'Unfavourable Intermediate' | 'High' | 'Very High';

export interface PaginationParams {
  page: number;
  pageSize: number;
  total?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

export interface DataCompleteness {
  score: number; // 0 - 100%
  baselineComplete: boolean;
  operationComplete: boolean;
  histologyComplete: boolean;
  followUpsComplete: number; // count of completed milestones
  totalFollowUpsExpected: number;
  missingFields: string[];
}
