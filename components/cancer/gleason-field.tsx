import React from 'react';
import { GleasonGrade, GradeGroup, ClinicalStage } from '@/types/cancer';
import { Badge } from '@/components/ui/badge';
import { GRADE_GROUP_MAP } from '@/config/clinical-options';

export function GleasonField({ grade }: { grade?: GleasonGrade }) {
  if (!grade) return <span className="text-muted-foreground italic">Not specified</span>;
  const gg = GRADE_GROUP_MAP[grade];
  return (
    <div className="flex items-center gap-2">
      <span className="font-bold text-foreground dark:text-white">{grade}</span>
      <Badge variant="info" className="text-[10px]">GG {gg}</Badge>
    </div>
  );
}

export function GradeGroupField({ gradeGroup }: { gradeGroup?: GradeGroup }) {
  if (!gradeGroup) return <span className="text-muted-foreground italic">—</span>;
  return (
    <Badge variant="info">
      Grade Group {gradeGroup}
    </Badge>
  );
}

export function ClinicalStageField({ stage }: { stage?: ClinicalStage }) {
  if (!stage) return <span className="text-muted-foreground italic">—</span>;
  return (
    <Badge variant="outline" className="border-info/20 bg-info-muted text-info-muted-foreground">
      Stage {stage}
    </Badge>
  );
}
