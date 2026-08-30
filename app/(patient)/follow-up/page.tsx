'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/api-client';
import { formatDate } from '@/lib/formatters';
import { CalendarClock, CheckCircle2, Clock, ArrowRight, User } from 'lucide-react';
import Link from 'next/link';
import { useCurrentPatient } from '@/lib/auth';
import { PatientFullRecord } from '@/types/patient';

export default function PatientFollowUpSchedulePage() {
  const { patient, isLoading } = useCurrentPatient();

  if (isLoading) {
    return <div className="p-12 text-center text-sm text-muted-foreground">Loading your record...</div>;
  }

  if (!patient) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">
        No patient record is linked to this login. Please contact your clinical team.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your 3-Year Follow-up Care Pathway</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Personalized recovery milestone schedule for <strong>{patient.firstName} {patient.surname}</strong> (Surgeon: {patient.primarySurgeon}).
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          NHS: {patient.nhsNumber}
        </Badge>
      </div>

      <div className="space-y-4">
        {patient?.followUps?.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-8 text-center text-xs text-muted-foreground">
              No follow-up milestones scheduled yet.
            </CardContent>
          </Card>
        ) : (
          patient?.followUps?.map((fu) => (
            <Card key={fu.id} className="shadow-sm bg-card">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm ${
                    fu.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                  }`}>
                    {fu.milestone.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground">
                        {fu.targetMonths}-Month Milestone Review
                      </h4>
                      <Badge variant={fu.status === 'completed' ? 'success' : 'warning'} className="text-[10px]">
                        {fu.status === 'completed' ? 'Completed' : 'Scheduled'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Target Due Date: <strong>{formatDate(fu.dueDate)}</strong>
                    </p>
                    {fu.status === 'completed' && (
                      <div className="text-xs text-muted-foreground mt-1">
                        PSA: <strong className="text-primary">{fu.psa !== undefined ? `${fu.psa} ng/mL` : 'Undetectable (<0.01)'}</strong> • Continence: {fu.continence?.dayStatus || 'Dry'}
                      </div>
                    )}
                  </div>
                </div>

                {fu.status !== 'completed' && (
                  <Link href="/assessment">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs border-teal-300 text-primary hover:bg-teal-50">
                      <span>Fill Questionnaire</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
