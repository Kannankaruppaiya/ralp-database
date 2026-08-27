import { GradeGroup, GleasonGrade } from '@/types/cancer';
export { formatDate, formatDateTime, calculateAge, calculateMilestoneDate, getDaysRemaining } from './date';

export function formatNhsNumber(rawNhs?: string | null): string {
  if (!rawNhs) return '—';
  const clean = rawNhs.replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 10)}`;
  }
  return rawNhs;
}

export function formatPsa(psa?: number | null): string {
  if (psa === undefined || psa === null) return '—';
  if (psa < 0.01) return '< 0.01 ng/mL';
  if (psa < 0.02) return '< 0.02 ng/mL';
  return `${psa.toFixed(2)} ng/mL`;
}

export function getRiskCategory(psa?: number, gleason?: GleasonGrade, stage?: string): { category: string; color: string } {
  if (!psa && !gleason) return { category: 'Pending Data', color: 'bg-slate-100 text-slate-700' };

  const psaVal = psa || 0;
  const isHighGleason = gleason === '4+4' || gleason === '4+5' || gleason === '5+4' || gleason === '5+5';
  const isStage3or4 = stage === '3A' || stage === '3B' || stage === '4';

  if (psaVal > 20 || isHighGleason || isStage3or4) {
    return { category: 'High Risk', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
  if (psaVal >= 10 || gleason === '4+3') {
    return { category: 'Unfavourable Intermediate', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  if (gleason === '3+4') {
    return { category: 'Favourable Intermediate', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
  }
  return { category: 'Low Risk', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}

export function formatBloodLoss(ml?: number | null): string {
  if (ml === undefined || ml === null) return '—';
  return `${ml} mL`;
}

export function formatDuration(mins?: number | null): string {
  if (!mins) return '—';
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours > 0) {
    return `${hours}h ${remainingMins}m (${mins} mins)`;
  }
  return `${mins} mins`;
}
