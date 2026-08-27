import { format, parseISO, isValid, addMonths, differenceInDays, differenceInYears } from 'date-fns';

export function formatDate(dateString?: string | null, formatStr: string = 'dd MMM yyyy'): string {
  if (!dateString) return '—';
  try {
    const d = parseISO(dateString);
    if (!isValid(d)) return dateString;
    return format(d, formatStr);
  } catch {
    return dateString || '—';
  }
}

export function formatDateTime(dateString?: string | null): string {
  return formatDate(dateString, 'dd MMM yyyy, HH:mm');
}

export function calculateAge(dobString?: string | null): number | null {
  if (!dobString) return null;
  try {
    const dob = parseISO(dobString);
    if (!isValid(dob)) return null;
    return differenceInYears(new Date(), dob);
  } catch {
    return null;
  }
}

export function calculateMilestoneDate(operationDateStr: string, months: number): string {
  try {
    const opDate = parseISO(operationDateStr);
    if (!isValid(opDate)) return new Date().toISOString().split('T')[0];
    const target = addMonths(opDate, months);
    return target.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export function getDaysRemaining(dueDateStr?: string): { days: number; isOverdue: boolean; label: string } {
  if (!dueDateStr) return { days: 0, isOverdue: false, label: 'No date' };
  try {
    const due = parseISO(dueDateStr);
    const today = new Date();
    const diff = differenceInDays(due, today);
    if (diff < 0) {
      return { days: Math.abs(diff), isOverdue: true, label: `${Math.abs(diff)} days overdue` };
    }
    if (diff === 0) {
      return { days: 0, isOverdue: false, label: 'Due today' };
    }
    return { days: diff, isOverdue: false, label: `Due in ${diff} days` };
  } catch {
    return { days: 0, isOverdue: false, label: 'Invalid date' };
  }
}
