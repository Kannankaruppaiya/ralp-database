'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function VerifyAuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 shadow-sm">
          <ShieldCheck className="h-9 w-9" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Security Verification</h1>
          <p className="text-xs text-slate-500">Your clinician 2FA session has been confirmed.</p>
        </div>
        <Link href="/dashboard" className="block">
          <Button className="w-full gap-2 shadow-sm">
            <span>Proceed to Clinical Registry</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
