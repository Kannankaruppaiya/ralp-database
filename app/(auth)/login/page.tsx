'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField, FormLabel } from '@/components/ui/form';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  HeartPulse,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';
import { signIn, signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

function ClinicianLoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const isDeactivated = searchParams.get('deactivated') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<{ message: string; targetPortal?: 'admin' | 'patient' } | null>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);

    const sanitizedEmail = email.trim();

    try {
      const user = await signIn(sanitizedEmail, password);

      if (user.role === 'Data Manager') {
        await signOut();
        setAuthError({
          message: 'This account has Data Manager rights. Please sign in via the Administrator Gateway.',
          targetPortal: 'admin',
        });
        setIsAuthenticating(false);
        return;
      }

      if (user.role === 'Patient') {
        await signOut();
        setAuthError({
          message: 'This portal is for clinicians. Patient accounts must sign in via the Patient Portal.',
          targetPortal: 'patient',
        });
        setIsAuthenticating(false);
        return;
      }

      toast({
        title: `Welcome, ${user.name}`,
        description: `Signed in as ${user.role}.`,
        variant: 'success',
      });

      // An admin-provisioned account is held here until the clinician replaces
      // the temporary password, so the audit trail names the only person who
      // could have acted.
      if (user.mustChangePassword) {
        router.push('/change-password');
        return;
      }

      const nextUrl = searchParams.get('next');
      router.push(nextUrl || '/dashboard');
    } catch (err) {
      setIsAuthenticating(false);
      const errorMessage = err instanceof Error ? err.message : 'Invalid credentials. Please check and try again.';
      setAuthError({ message: errorMessage });
      toast({
        title: 'Sign-in failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full max-w-[460px] mx-auto space-y-6">
      {/* Contextual Alerts Area */}
      {isDeactivated && (
        <Alert variant="warning" className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="font-semibold text-sm">Session Terminated — Account Deactivated</AlertTitle>
          <AlertDescription className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
            Your session was closed because this account is marked as deactivated. If you require access to the registry, please contact your Trust Department Administrator or Lead Data Manager.
          </AlertDescription>
        </Alert>
      )}

      {authError && (
        <Alert variant="destructive" className="border-rose-500/50 bg-rose-500/10 text-rose-900 dark:text-rose-200">
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          <AlertTitle className="font-semibold text-sm">Authentication Failed</AlertTitle>
          <AlertDescription className="text-xs text-rose-800 dark:text-rose-300 mt-1 leading-relaxed">
            {authError.message}
            {authError.targetPortal === 'admin' && (
              <div className="mt-2.5">
                <Link
                  href="/admin-login"
                  className="inline-flex items-center gap-1.5 font-semibold text-xs text-teal-700 dark:text-teal-300 hover:underline"
                >
                  <span>Open Administrator Gateway</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
            {authError.targetPortal === 'patient' && (
              <div className="mt-2.5">
                <Link
                  href="/patient-login"
                  className="inline-flex items-center gap-1.5 font-semibold text-xs text-teal-700 dark:text-teal-300 hover:underline"
                >
                  <span>Open Patient Portal</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Authentication Card */}
      <div className="rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/80 dark:border-[#272727] p-6 sm:p-8 shadow-sm space-y-6">
        {/* Card Header & Context */}
        <div className="space-y-1.5 border-b border-slate-100 dark:border-[#272727] pb-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Clinician Authentication
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              NHS.net
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sign In to Surgical Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed [text-wrap:pretty]">
            Authorized gateway for Urology Consultants, Surgeons, Registrars, and Specialist Nurses.
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handlePasswordLogin} className="space-y-5" noValidate>
          <FormField>
            <FormLabel
              htmlFor="clinician-email"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              NHS.net Email Address <span className="text-rose-500" aria-hidden="true">*</span>
            </FormLabel>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" aria-hidden="true" />
              </div>
              <Input
                id="clinician-email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@nhs.net"
                className="pl-10 h-11 text-sm rounded-xl border-slate-200 dark:border-[#272727] focus-visible:ring-teal-500"
                disabled={isAuthenticating}
                required
              />
            </div>
          </FormField>

          <FormField>
            <div className="flex items-center justify-between">
              <FormLabel
                htmlFor="clinician-password"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Password <span className="text-rose-500" aria-hidden="true">*</span>
              </FormLabel>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" aria-hidden="true" />
              </div>
              <Input
                id="clinician-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 pr-11 h-11 text-sm rounded-xl border-slate-200 dark:border-[#272727] focus-visible:ring-teal-500"
                disabled={isAuthenticating}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </FormField>

          <Button
            type="submit"
            isLoading={isAuthenticating}
            disabled={isAuthenticating}
            className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all duration-200 gap-2 mt-2"
          >
            <span>{isAuthenticating ? 'Authenticating Session...' : 'Sign In to Clinical Registry'}</span>
            {!isAuthenticating && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </form>

        {/* Secondary Portal Routing */}
        <div className="pt-4 border-t border-slate-100 dark:border-[#272727] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Are you a patient?</span>
            <Link
              href="/patient-login"
              className="font-medium text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Patient Portal</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Data Governance Admin?</span>
            <Link
              href="/admin-login"
              className="font-medium text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Admin Gateway</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Institutional & Information Governance Trust Footnote */}
      <div className="text-center space-y-2 px-4">
        <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          <span>Caldicott Principle 7 &amp; NHS DSP Toolkit Compliant</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
          Oxford University Hospitals NHS FT • Department of Urology
          <br />
          Authorized hospital personnel only. Unauthorized access is audited.
        </p>
      </div>
    </div>
  );
}

export default function ClinicianLoginPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-[#FAFAFA] dark:bg-[#121212] text-slate-900 dark:text-slate-100 font-sans selection:bg-teal-600 selection:text-white">
      {/* Top Navigation Header */}
      <header className="w-full border-b border-slate-200/80 dark:border-[#272727] bg-white/80 dark:bg-[#181818]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg p-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-600/20 group-hover:bg-teal-700 transition-colors">
              <HeartPulse className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none block">
                RALP Database <span className="text-teal-600 dark:text-teal-400 font-mono text-xs font-semibold">v2.0</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mt-1">
                Surgical Outcomes &amp; PROMs Platform
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#272727] text-slate-600 dark:text-slate-300 text-xs font-medium">
              <Building2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
              <span>Churchill Hospital, Oxford</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Form Body */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <Suspense
          fallback={
            <div className="w-full max-w-[460px] mx-auto p-8 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200/80 dark:border-[#272727] animate-pulse space-y-4">
              <div className="h-6 w-1/3 bg-slate-200 dark:bg-[#272727] rounded" />
              <div className="h-4 w-2/3 bg-slate-100 dark:bg-[#272727] rounded" />
              <div className="h-11 bg-slate-100 dark:bg-[#272727] rounded-xl mt-6" />
              <div className="h-11 bg-slate-100 dark:bg-[#272727] rounded-xl" />
              <div className="h-11 bg-teal-600/30 rounded-xl" />
            </div>
          }
        >
          <ClinicianLoginForm />
        </Suspense>
      </main>

      {/* Subtle Bottom Trust Bar */}
      <footer className="w-full border-t border-slate-200/60 dark:border-[#272727] py-3 text-center text-xs text-slate-600 dark:text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Department of Urology • Churchill Hospital</span>
          <span>Oxford University Hospitals NHS Foundation Trust</span>
        </div>
      </footer>
    </div>
  );
}
