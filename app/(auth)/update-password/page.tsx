'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField, FormLabel } from '@/components/ui/form';
import { ArrowLeft, Lock, HeartPulse, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { resetPassword } from '@/lib/auth';

const MIN_LENGTH = 8;

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // The reset link carries a single-use token. Without it there is nothing to
  // reset, so the clinician is sent back to request a fresh link rather than
  // shown a form the server would only reject.
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < MIN_LENGTH) {
      toast({
        title: 'Password too short',
        description: `Choose at least ${MIN_LENGTH} characters.`,
        variant: 'destructive',
      });
      return;
    }
    if (password !== confirm) {
      toast({
        title: 'Passwords do not match',
        description: 'Re-enter the same password in both fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await resetPassword(token, password);
      toast({
        title: 'Password updated',
        description: 'Sign in with your new password.',
        variant: 'success',
      });
      router.push('/login');
    } catch (err) {
      setIsSaving(false);
      toast({
        title: 'Could not update password',
        description: err instanceof Error ? err.message : 'Please request a fresh reset link and try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6">
      <div className="max-w-md w-full mx-auto my-auto space-y-5">
        <div className="text-center space-y-1.5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20 mb-1">
            <HeartPulse className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            RALP Database v2
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Oxford Urology Clinician & Staff Password Reset
          </p>
        </div>

        <Card className="shadow-xl border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              Choose a New Password
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Set the password you will use to sign in to the surgical registry.
            </p>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            {!token ? (
              <div className="space-y-4 py-2 text-center">
                <p className="text-xs text-slate-500">
                  This reset link is invalid or has expired. Request a new one to continue.
                </p>
                <Link href="/forgot-password" className="block">
                  <Button variant="outline" size="sm" className="text-xs">
                    Request a new reset link
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField>
                  <FormLabel className="text-xs font-semibold">New Password</FormLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="pl-9 pr-9 text-xs h-9"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormField>

                <FormField>
                  <FormLabel className="text-xs font-semibold">Confirm New Password</FormLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter new password"
                      className="pl-9 text-xs h-9"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </FormField>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full gap-2 shadow-md text-xs h-10 mt-1"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isSaving ? 'Updating password…' : 'Update Password'}</span>
                </Button>
              </form>
            )}

            <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/login"
                className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-1.5"
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
    </div>
  );
}
