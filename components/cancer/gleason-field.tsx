import React from 'react';
import { GleasonGrade, GradeGroup, ClinicalStage } from '@/types/cancer';
import { Badge } from '@/components/ui/badge';
import { GRADE_GROUP_MAP } from '@/config/clinical-options';

export function GleasonField({ grade }: { grade?: GleasonGrade }) {
  if (!grade) return <span className="text-slate-400 italic">Not specified</span>;
  const gg = GRADE_GROUP_MAP[grade];
  return (
    <div className="flex items-center gap-2">
      <span className="font-bold text-slate-900 dark:text-white">{grade}</span>
      <Badge variant="info" className="text-[10px]">GG {gg}</Badge>
    </div>
  );
}

export function GradeGroupField({ gradeGroup }: { gradeGroup?: GradeGroup }) {
  if (!gradeGroup) return <span className="text-slate-400 italic">—</span>;
  return (
    <Badge variant="info">
      Grade Group {gradeGroup}
    </Badge>
  );
}

export function ClinicalStageField({ stage }: { stage?: ClinicalStage }) {
  if (!stage) return <span className="text-slate-400 italic">—</span>;
  return (
    <Badge variant="outline" className="border-cyan-300 bg-cyan-50 text-cyan-800">
      Stage {stage}
    </Badge>
  );
}
