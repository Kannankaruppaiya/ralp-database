'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormField, FormLabel } from '@/components/ui/form';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Lock,
  ShieldCheck,
  Smartphone,
  FileHeart,
  Calendar,
  CreditCard,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { signInPatient, signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function PatientLoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [authMode, setAuthMode] = useState<'nhs_number' | 'sms_token'>('nhs_number');
  const [smsOtp, setSmsOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');

    try {
      const user = await signInPatient(firstName, surname, dateOfBirth);

      if (user.role !== 'Patient') {
        await signOut();
        throw new Error('This portal is reserved exclusively for registered patients.');
      }

      toast({
        title: `Welcome back, ${user.name}`,
        description: 'Opening your recovery dashboard.',
        variant: 'success',
      });
      router.push('/home');
    } catch (err) {
      setIsVerifying(false);
      setError(
        err instanceof Error ? err.message : 'Sign-in failed. Please check your details.'
      );
    }
  };

  const handleSendOtp = () => {
    toast({
      title: 'SMS sign-in unavailable',
      description: 'NHS Notify is not enabled for this deployment. Please sign in with your name and date of birth.',
      variant: 'destructive',
    });
  };

  return (
    <div className="min-h-[100dvh] grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#121212] text-slate-900 dark:text-slate-100 font-sans selection:bg-purple-600 selection:text-white">
      {/* LEFT COLUMN: Serene Patient Journey */}
      <div className="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-12 overflow-hidden border-r border-slate-200 dark:border-[#272727] bg-[#121212]">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/patient-recovery-hero.jpg"
            alt="Oxford Hospital Wellness Garden"
            fill
            className="object-cover object-center opacity-25 mix-blend-luminosity scale-105 transition-transform duration-1000"
            priority
          />
          <div className="absolute inset-0 bg-[#121212]/85" />
        </div>

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-sm shadow-purple-600/20 group-hover:bg-purple-500 transition-colors">
              <FileHeart className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-white text-lg tracking-tight leading-none block">
                My Prostate Recovery
              </span>
              <span className="text-[10px] font-semibold text-purple-300 uppercase tracking-widest mt-1 block">
                Oxford Patient Outcomes Portal
              </span>
            </div>
          </Link>

          <Badge variant="outline" className="border-[#272727] bg-[#181818] text-purple-300 text-xs px-3 py-1 gap-1.5 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
            <span>NHS Caldicott Protected</span>
          </Badge>
        </div>

        {/* Center Statement */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181818] border border-[#272727] text-purple-300 text-[11px] font-semibold uppercase tracking-wider">
            <Activity className="h-3.5 w-3.5 text-purple-400" />
            <span>Personalized Recovery Tracking</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight leading-[1.15] [text-wrap:balance]">
            Your Recovery Journey.{' '}
            <span className="hero-gradient-text block">
              Directly Connected to Your Care Team.
            </span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-xl [text-wrap:pretty]">
            Complete your confidential follow-up questionnaires (IPSS urinary scores, continence recovery, and SHIM wellness index) from the comfort of home.
          </p>

          <div className="grid grid-cols-4 gap-3 pt-4">
            <div className="p-3.5 rounded-xl bg-[#181818] border border-[#272727] text-center space-y-1">
              <div className="text-xs font-bold text-teal-400 font-mono [font-variant-numeric:tabular-nums]">6 Weeks</div>
              <div className="text-[10px] text-slate-400">Catheter TWOC</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#181818] border border-[#272727] text-center space-y-1">
              <div className="text-xs font-bold text-purple-300 font-mono [font-variant-numeric:tabular-nums]">6 Months</div>
              <div className="text-[10px] text-slate-400">Continence Check</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#181818] border border-[#272727] text-center space-y-1">
              <div className="text-xs font-bold text-pink-300 font-mono [font-variant-numeric:tabular-nums]">12 Months</div>
              <div className="text-[10px] text-slate-400">Potency & PSA</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#181818] border border-[#272727] text-center space-y-1">
              <div className="text-xs font-bold text-indigo-300 font-mono [font-variant-numeric:tabular-nums]">36 Months</div>
              <div className="text-[10px] text-slate-400">Long-Term Care</div>
            </div>
          </div>
        </div>

        {/* Bottom Trust */}
        <div className="relative z-10 pt-6 border-t border-[#272727] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              <span>Strictly Confidential</span>
            </span>
            <span>•</span>
            <span>NHS Identity Verified</span>
            <span>•</span>
            <span>Direct Surgical Team Sync</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">OXFORD-PROMS-V2</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Dedicated Patient Login Form */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-white dark:bg-[#121212] min-h-[100dvh] lg:min-h-full">
        {/* Top Header & Theme Toggle */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-[#272727]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
              <FileHeart className="h-5 w-5" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-base">My Recovery</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">Patient Portal Sign In</span>
              <Link href="/login" className="text-xs text-teal-600 dark:text-teal-400 hover:underline transition-colors flex items-center gap-1">
                <span>Doctor Login</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Patient Login</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 [text-wrap:pretty]">
              Sign in with your name and date of birth to view your confidential recovery record.
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] p-6 space-y-5 shadow-sm">
            {/* Segmented Mode Selector */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-[#121212] border border-slate-200 dark:border-[#272727] text-xs font-semibold text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setAuthMode('nhs_number')}
                className={`py-2 px-3 rounded-lg text-center transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  authMode === 'nhs_number'
                    ? 'bg-purple-600 text-white font-semibold shadow-sm'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Patient Account</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('sms_token')}
                className={`py-2 px-3 rounded-lg text-center transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  authMode === 'sms_token'
                    ? 'bg-purple-600 text-white font-semibold shadow-sm'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>SMS Magic Code</span>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs rounded-xl">
                {error}
              </div>
            )}

            {/* Mode 1: Name & Date of Birth */}
            {authMode === 'nhs_number' && (
              <form onSubmit={(e) => void handleSignIn(e)} className="space-y-4">
                <FormField>
                  <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">First Name</FormLabel>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Arthur"
                      className="pl-10 text-xs h-10 rounded-xl"
                      required
                    />
                  </div>
                </FormField>

                <FormField>
                  <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">Surname</FormLabel>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      autoComplete="family-name"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      placeholder="e.g. Pendleton"
                      className="pl-10 text-xs h-10 rounded-xl"
                      required
                    />
                  </div>
                </FormField>

                <FormField>
                  <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date of Birth</FormLabel>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="date"
                      autoComplete="bday"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="pl-10 text-xs h-10 rounded-xl"
                      required
                    />
                  </div>
                </FormField>

                <Button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full h-10 rounded-xl gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm mt-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>{isVerifying ? 'Verifying Identity...' : 'Access My Recovery Record'}</span>
                </Button>
              </form>
            )}

            {/* Mode 2: SMS OTP */}
            {authMode === 'sms_token' && (
              <div className="space-y-4">
                {!otpSent ? (
                  <div className="text-center py-3 space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#272727] text-purple-600 dark:text-purple-400">
                      <Smartphone className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">NHS Notify SMS Authentication</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        We will send a one-time 6-digit security code to your registered mobile number.
                      </p>
                    </div>

                    <Button
                      onClick={handleSendOtp}
                      className="w-full h-10 rounded-xl gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm"
                    >
                      <Smartphone className="h-4 w-4" />
                      <span>Send 6-Digit Code to My Phone</span>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                    <FormField>
                      <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">6-Digit Security Code</FormLabel>
                      <Input
                        value={smsOtp}
                        onChange={(e) => setSmsOtp(e.target.value)}
                        placeholder="------"
                        className="font-mono text-center tracking-widest text-xl font-bold h-11 rounded-xl"
                        maxLength={6}
                        required
                      />
                    </FormField>

                    <Button
                      type="submit"
                      disabled={isVerifying}
                      className="w-full h-10 rounded-xl gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>{isVerifying ? 'Confirming Access...' : 'Verify Code & Enter Portal'}</span>
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="text-center text-[11px] text-slate-500">
            Oxford University Hospitals NHS Foundation Trust • Urology Registry
          </div>
        </div>
      </div>
    </div>
  );
}
