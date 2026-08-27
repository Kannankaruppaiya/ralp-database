import { FollowUpRecord, FollowUpMilestone } from '@/types/follow-up';
import { FOLLOW_UP_MILESTONES } from '@/config/follow-ups';
import { calculateMilestoneDate, getDaysRemaining } from '@/lib/date';

export function generateFollowUpSchedule(patientId: string, operationDate: string): FollowUpRecord[] {
  return FOLLOW_UP_MILESTONES.map((config, index) => {
    const dueDate = calculateMilestoneDate(operationDate, config.months);
    const { isOverdue, days } = getDaysRemaining(dueDate);

    let status: FollowUpRecord['status'] = 'scheduled';
    if (isOverdue) {
      status = 'overdue';
    } else if (days <= 30) {
      status = 'due';
    }

    return {
      id: `fu-${patientId}-${config.milestone}-${index}`,
      patientId,
      milestone: config.milestone,
      targetMonths: config.months,
      dueDate,
      status,
      promSubmitted: false,
    };
  });
}
