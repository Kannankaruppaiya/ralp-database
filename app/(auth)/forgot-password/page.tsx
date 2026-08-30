'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField, FormLabel } from '@/components/ui/form';
import { ArrowLeft, Mail, HeartPulse, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('v.kannan@nhs.net');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    toast({
      title: 'Reset Instructions Sent',
      description: `Dispatched secure password reset link to ${email}.`,
      variant: 'success',
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6">
      <div className="max-w-md w-full mx-auto my-auto space-y-5">
        <div className="text-center space-y-1.5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 mb-1">
            <HeartPulse className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            RALP Database v2
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Oxford Urology Clinician & Staff Password Recovery
          </p>
        </div>

        <Card className="shadow-xl border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
              Reset Clinician Password
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter your registered NHS.net or hospital trust email address to receive a secure self-service reset link.
            </p>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField>
                  <FormLabel className="text-xs font-semibold">NHS.net / Hospital Email</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. v.kannan@nhs.net"
                      className="pl-9 text-xs h-9"
                      required
                    />
                  </div>
                </FormField>

                <Button type="submit" className="w-full gap-2 shadow-md text-xs h-10 mt-1">
                  <Mail className="h-4 w-4" />
                  <span>Send Reset Instructions</span>
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Check your NHS inbox
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    We have sent a time-limited reset token to <strong className="font-mono text-slate-700 dark:text-slate-300">{email}</strong>.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSubmitted(false)}
                  className="text-xs"
                >
                  Try another email
                </Button>
              </div>
            )}

            <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/login"
                className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Clinician Sign In</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-[11px] text-slate-400">
          Oxford University Hospitals NHS FT • NHS Caldicott Protected
        </div>
      </div>

      <div className="max-w-md mx-auto w-full text-center text-[11px] text-slate-400 py-2">
        If you are locked out or smartcard PIN is blocked, please contact NHS IT Service Desk.
      </div>
    </div>
  );
}
