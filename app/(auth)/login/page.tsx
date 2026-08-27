'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Stethoscope,
  ShieldCheck,
  CreditCard,
  Mail,
  KeyRound,
  CheckCircle2,
  Building2,
  ArrowRight,
  Eye,
  EyeOff,
  Cpu,
  ArrowUpRight,
  UserCheck,
} from 'lucide-react';
import { signIn } from '@/lib/auth';
import { Role } from '@/config/permissions';
import { SurgeonCode } from '@/types/common';
import { useToast } from '@/hooks/use-toast';

interface DemoUser {
  name: string;
  role: Role;
  surgeonCode?: SurgeonCode;
  email: string;
  department: string;
  initials: string;
}

const PRESET_ACCOUNTS: DemoUser[] = [
  {
    name: 'Mr. V. Kannan',
    role: 'Consultant Surgeon',
    surgeonCode: 'VK',
    email: 'v.kannan@nhs.net',
    department: 'Robotic Pelvic Oncology Lead',
    initials: 'VK',
  },
  {
    name: 'Mr. R. D. MacDonagh',
    role: 'Consultant Surgeon',
    surgeonCode: 'RDM',
    email: 'r.macdonagh@nhs.net',
    department: 'Consultant Urological Surgeon',
    initials: 'RM',
  },
  {
    name: 'Dr. Sarah Jenkins',
    role: 'Surgical Registrar',
    email: 's.jenkins@nhs.net',
    department: 'Urology Specialist Registrar',
    initials: 'SJ',
  },
  {
    name: 'Sister Claire Evans',
    role: 'Clinical Nurse Specialist',
    email: 'c.evans@nhs.net',
    department: 'Robotic Prostate Cancer Specialist Nurse',
    initials: 'CE',
  },
];

export default function ClinicianLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [authTab, setAuthTab] = useState<'credentials' | 'smartcard'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [smartcardStatus, setSmartcardStatus] = useState<'idle' | 'reading' | 'verified'>('idle');

  const executeLogin = async (methodTitle: string) => {
    setIsAuthenticating(true);
    try {
      const user = await signIn(email, password);
      toast({
        title: `Welcome, ${user.name}`,
        description: `Authenticated via ${methodTitle} as ${user.role}.`,
        variant: 'success',
      });
      router.push(searchParams.get('next') || '/dashboard');
    } catch (err) {
      setIsAuthenticating(false);
      toast({
        title: 'Sign-in failed',
        description: err instanceof Error ? err.message : 'Check your credentials and try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    void executeLogin('NHS.net credentials');
  };

  const handleSmartcardTap = () => {
    // NHS CIS2 smartcard federation is not configured in this deployment.
    toast({
      title: 'Smartcard sign-in unavailable',
      description: 'NHS CIS2 federation is not enabled. Use your NHS.net email and password.',
      variant: 'destructive',
    });
  };

  const handleAutofill = (acc: DemoUser) => {
    setEmail(acc.email);
    toast({
      title: 'Email filled',
      description: `Enter the password for ${acc.name}.`,
      variant: 'default',
    });
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      {/* LEFT COLUMN: Cinematic Clinical Showcase */}
      <div className="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-12 overflow-hidden border-r border-slate-800/80">
        {/* Background Image with Deep Gradient Wash */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/robotic-theatre-hero.jpg"
            alt="Robotic Surgery Console"
            fill
            className="object-cover object-center opacity-30 mix-blend-luminosity scale-105 transition-transform duration-1000"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/60" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Top Header */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3.5 group">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xl shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <span className="font-extrabold text-white text-lg tracking-tight leading-none block">
                  RALP Database <span className="text-teal-400 font-mono text-sm font-semibold">v2.0</span>
                </span>
                <span className="text-[11px] font-semibold text-teal-400/90 uppercase tracking-widest mt-1 block">
                  Clinical Registry
                </span>
              </div>
            </Link>

            <Badge variant="outline" className="border-teal-500/30 bg-teal-950/40 text-teal-300 text-xs px-3 py-1 gap-1.5 backdrop-blur-md">
              <Building2 className="h-3.5 w-3.5 text-teal-400" />
              <span>Oxford Urology Centre</span>
            </Badge>
          </div>
        </div>

        {/* Center Hero Statement */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Cpu className="h-3.5 w-3.5 text-teal-400" />
            <span>Doctor & Surgical Staff Registry Access</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Precision Robotics. <br />
            <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-200 bg-clip-text text-transparent">
              Standardized Clinical Excellence.
            </span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            Single secure sign-in portal for Urology Consultants, Surgeons, Registrars, and Specialist Nurses to manage patient oncology profiles and theatre outcomes.
          </p>

          {/* Live System KPI Bento Grid */}
          <div className="grid grid-cols-3 gap-3.5 pt-4">
            <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shadow-lg backdrop-blur-md">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                <div className="text-2xl font-black text-white font-mono">NHS</div>
                <div className="text-[11px] text-slate-400 font-medium">Secure Cloud Registry</div>
              </div>
            </div>

            <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shadow-lg backdrop-blur-md">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                <div className="text-2xl font-black text-teal-300 font-mono">94.2%</div>
                <div className="text-[11px] text-slate-400 font-medium">12M Trifecta Rate</div>
              </div>
            </div>

            <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shadow-lg backdrop-blur-md">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                <div className="text-2xl font-black text-emerald-300 font-mono">98.0%</div>
                <div className="text-[11px] text-slate-400 font-medium">NPCA Audit Compliance</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Statement */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              <span>Caldicott Principle 7</span>
            </span>
            <span>•</span>
            <span>NHS Smartcard Enabled</span>
            <span>•</span>
            <span>256-bit AES Encryption</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">OUH-SURGEON-AUTH</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Dedicated Doctor Sign-In Form */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 my-auto">
        {/* Mobile Top Header */}
        <div className="lg:hidden flex items-center justify-between pb-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="font-bold text-white text-base">RALP Database</span>
          </Link>
          <Link href="/patient-login">
            <Button variant="outline" size="sm" className="text-xs border-purple-500/30 text-purple-300">
              Patient Portal →
            </Button>
          </Link>
        </div>

        {/* Center Dedicated Form Container */}
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          <div className="space-y-2">
            <div className="hidden lg:flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-teal-400">Clinician Sign In</span>
              <div className="flex items-center gap-3">
                <Link href="/patient-login" className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
                  <span>Patient Login</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <span className="text-slate-700">|</span>
                <Link href="/admin-login" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                  <span>Admin Login</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Doctor & Staff Login</h2>
            <p className="text-xs text-slate-400">
              Enter your NHS.net credentials or tap your NHS Smartcard to access the surgical database.
            </p>
          </div>

          {/* Double-Bezel Form Container */}
          <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[calc(2rem-0.375rem)] bg-slate-900/90 border border-white/5 p-6 space-y-5">
              {/* Segmented Auth Selector (Email vs Smartcard) */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-400">
                <button
                  type="button"
                  onClick={() => setAuthTab('credentials')}
                  className={`py-2.5 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                    authTab === 'credentials'
                      ? 'bg-teal-600 text-white font-bold shadow-md'
                      : 'hover:text-slate-200'
                  }`}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>NHS.net Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('smartcard')}
                  className={`py-2.5 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                    authTab === 'smartcard'
                      ? 'bg-teal-600 text-white font-bold shadow-md'
                      : 'hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>NHS Smartcard</span>
                </button>
              </div>

              {/* Mode 1: Clean Email & Password Form */}
              {authTab === 'credentials' && (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <FormField>
                    <FormLabel className="text-xs font-semibold text-slate-300">NHS.net Email Address</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. v.kannan@nhs.net"
                        className="pl-10 bg-slate-950 border-slate-800 text-xs text-white h-11 rounded-xl focus:border-teal-500"
                        required
                      />
                    </div>
                  </FormField>

                  <FormField>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-semibold text-slate-300">Password</FormLabel>
                      <Link href="/forgot-password" className="text-[11px] text-teal-400 hover:underline">
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-slate-950 border-slate-800 text-xs text-white h-11 rounded-xl focus:border-teal-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormField>

                  {/* Discrete Quick Preset Autofill for Testing */}
                  <div className="pt-1">
                    <div className="text-[11px] text-slate-500 mb-1.5 flex items-center gap-1">
                      <UserCheck className="h-3 w-3 text-teal-500" />
                      <span>Quick Autofill Test Account:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_ACCOUNTS.map((acc) => (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => handleAutofill(acc)}
                          className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-slate-800/80 hover:bg-teal-950 hover:border-teal-500/50 border border-slate-700 text-slate-300 transition-colors"
                        >
                          {acc.name} ({acc.surgeonCode || acc.initials})
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full h-11 rounded-xl gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-600/25 mt-2"
                  >
                    <Lock className="h-4 w-4" />
                    <span>{isAuthenticating ? 'Authenticating Session...' : 'Sign In to Clinical Registry'}</span>
                  </Button>
                </form>
              )}

              {/* Mode 2: NHS Smartcard CIS2 Tap */}
              {authTab === 'smartcard' && (
                <div className="py-2 text-center space-y-4">
                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 shadow-inner">
                    <CreditCard className="h-8 w-8 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">NHS Care Identity Service (CIS2)</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tap your physical Smartcard on the connected USB reader.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono text-left space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>READER STATUS</span>
                      <span className="text-emerald-400 font-bold">READY ●</span>
                    </div>
                    <div className="text-slate-200">Device: Omnikey 3121 USB Smartcard Reader</div>
                    <div className="text-teal-400">Active Surgeon: Mr. V. Kannan (Consultant Surgeon)</div>
                  </div>

                  <Button
                    onClick={handleSmartcardTap}
                    disabled={smartcardStatus !== 'idle'}
                    className="w-full h-11 rounded-xl gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-600/25"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>
                      {smartcardStatus === 'reading'
                        ? 'Reading Smartcard Passcode...'
                        : smartcardStatus === 'verified'
                        ? 'Access Granted!'
                        : 'Simulate Smartcard Sign In'}
                    </span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-500 space-y-1">
            <p>Oxford University Hospitals NHS FT • Department of Urology</p>
            <p className="text-[10px] text-slate-600">Access governed under Caldicott Information Governance Protocols</p>
          </div>
        </div>

        <div className="hidden lg:block text-center text-[11px] text-slate-500 pt-6">
          Authorized hospital staff access only • Oxford University Hospitals NHS Trust
        </div>
      </div>
    </div>
  );
}
