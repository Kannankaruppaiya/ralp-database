'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormField, FormLabel } from '@/components/ui/form';
import {
  HeartPulse,
  Lock,
  ShieldCheck,
  Smartphone,
  UserCheck,
  FileHeart,
  Calendar,
  CreditCard,
  Building2,
  Activity,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { signIn } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function PatientLoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [authMode, setAuthMode] = useState<'nhs_number' | 'sms_token'>('nhs_number');
  const [smsOtp, setSmsOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /**
   * Patients sign in with the credentials their clinical team issued.
   *
   * The previous build let anyone through by typing an NHS number, which is an
   * identifier, not a secret — knowing one must never grant access to the
   * record it names.
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');

    try {
      const user = await signIn(email, password);
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
      description: 'NHS Notify is not enabled for this deployment. Please sign in with your email and password.',
      variant: 'destructive',
    });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      {/* LEFT COLUMN: Serene Patient Journey */}
      <div className="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-12 overflow-hidden border-r border-slate-800/80">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/patient-recovery-hero.jpg"
            alt="Oxford Hospital Wellness Garden"
            fill
            className="object-cover object-center opacity-30 mix-blend-luminosity scale-105 transition-transform duration-1000"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-purple-950/60" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-xl shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <FileHeart className="h-6 w-6" />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight leading-none block">
                My Prostate Recovery
              </span>
              <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-widest mt-1 block">
                Oxford Patient Outcomes Portal
              </span>
            </div>
          </Link>

          <Badge variant="outline" className="border-purple-500/30 bg-purple-950/40 text-purple-300 text-xs px-3 py-1 gap-1.5 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
            <span>NHS Caldicott Protected</span>
          </Badge>
        </div>

        {/* Center Statement */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Activity className="h-3.5 w-3.5 text-purple-400" />
            <span>Personalized Recovery Tracking</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Your Recovery Journey. <br />
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-200 bg-clip-text text-transparent">
              Directly Connected to Your Care Team.
            </span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            Complete your confidential follow-up questionnaires (IPSS urinary scores, continence recovery, and SHIM wellness index) from the comfort of home.
          </p>

          <div className="grid grid-cols-4 gap-3 pt-4">
            <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shadow-lg backdrop-blur-md">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-center space-y-1">
                <div className="text-xs font-bold text-blue-400">6 Weeks</div>
                <div className="text-[10px] text-slate-400">Catheter TWOC</div>
              </div>
            </div>

            <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shadow-lg backdrop-blur-md">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-center space-y-1">
                <div className="text-xs font-bold text-purple-300">6 Months</div>
                <div className="text-[10px] text-slate-400">Continence Check</div>
              </div>
            </div>

            <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shadow-lg backdrop-blur-md">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-center space-y-1">
                <div className="text-xs font-bold text-pink-300">12 Months</div>
                <div className="text-[10px] text-slate-400">Potency & PSA</div>
              </div>
            </div>

            <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shadow-lg backdrop-blur-md">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-center space-y-1">
                <div className="text-xs font-bold text-indigo-300">36 Months</div>
                <div className="text-[10px] text-slate-400">Long-Term Care</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
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
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 my-auto">
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Patient Portal Sign In</span>
              <Link href="/login" className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                <span>Doctor Login</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Patient Login</h2>
            <p className="text-xs text-slate-400">
              Sign in with your 10-digit NHS Number and Date of Birth to view your recovery record.
            </p>
          </div>

          <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[calc(2rem-0.375rem)] bg-slate-900/90 border border-white/5 p-6 space-y-5">
              {/* Segmented Mode Selector */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-400">
                <button
                  type="button"
                  onClick={() => setAuthMode('nhs_number')}
                  className={`py-2.5 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'nhs_number'
                      ? 'bg-purple-600 text-white font-bold shadow-md'
                      : 'hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>NHS Number & DOB</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('sms_token')}
                  className={`py-2.5 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'sms_token'
                      ? 'bg-purple-600 text-white font-bold shadow-md'
                      : 'hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>SMS Magic Code</span>
                </button>
              </div>

              {error && (
                <div className="p-3 bg-rose-950/40 border border-rose-900 text-rose-300 text-xs rounded-xl">
                  {error}
                </div>
              )}

              {/* Mode 1: NHS Number & DOB */}
              {authMode === 'nhs_number' && (
                <form onSubmit={(e) => void handleSignIn(e)} className="space-y-4">
                  <FormField>
                    <FormLabel className="text-xs font-semibold text-slate-300">Email Address</FormLabel>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="the address your clinical team registered"
                        className="pl-10 text-xs bg-slate-950 border-slate-800 text-white h-11 rounded-xl focus:border-purple-500"
                        required
                      />
                    </div>
                  </FormField>

                  <FormField>
                    <FormLabel className="text-xs font-semibold text-slate-300">Password</FormLabel>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-9 text-xs bg-slate-950 border-slate-800 text-white h-11 rounded-xl focus:border-purple-500"
                        required
                      />
                    </div>
                  </FormField>

                  <Button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full h-11 rounded-xl gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 mt-2"
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
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                        <Smartphone className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">NHS Notify SMS Authentication</h3>
                        <p className="text-xs text-slate-400 mt-1">
                          We will send a one-time 6-digit security code to your registered mobile number.
                        </p>
                      </div>

                      <Button
                        onClick={handleSendOtp}
                        className="w-full h-11 rounded-xl gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25"
                      >
                        <Smartphone className="h-4 w-4" />
                        <span>Send 6-Digit Code to My Phone</span>
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                      <div className="p-3 bg-purple-950/50 rounded-xl border border-purple-800/80 text-xs text-purple-200">
                        <div className="font-semibold flex items-center gap-1.5 text-purple-300">
                          <CheckCircle2 className="h-4 w-4 text-purple-400" />
                          <span>Security Code Dispatched!</span>
                        </div>
                        <p className="text-[11px] text-purple-300/80 mt-1">
                          SMS verification is not enabled for this deployment.
                        </p>
                      </div>

                      <FormField>
                        <FormLabel className="text-xs font-semibold text-slate-300">6-Digit Security Code</FormLabel>
                        <Input
                          value={smsOtp}
                          onChange={(e) => setSmsOtp(e.target.value)}
                          placeholder="------"
                          className="font-mono text-center tracking-widest text-xl font-bold bg-slate-950 border-slate-800 text-white h-12 rounded-xl focus:border-purple-500"
                          maxLength={6}
                          required
                        />
                      </FormField>

                      <Button
                        type="submit"
                        disabled={isVerifying}
                        className="w-full h-11 rounded-xl gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>{isVerifying ? 'Confirming Access...' : 'Verify Code & Enter Portal'}</span>
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-500">
            Oxford University Hospitals NHS Foundation Trust • Urology Registry
          </div>
        </div>
      </div>
    </div>
  );
}
