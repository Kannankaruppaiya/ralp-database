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
  ShieldCheck,
  Lock,
  KeyRound,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  HeartPulse,
  ArrowUpRight,
  Terminal,
  ShieldAlert,
} from 'lucide-react';
import { signIn, signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    try {
      const user = await signIn(adminEmail, password);

      // The role comes from the profile record, not from the address typed in.
      if (user.role !== 'Data Manager') {
        await signOut();
        throw new Error('This account does not hold governance administrator rights.');
      }

      toast({
        title: 'Administrator access granted',
        description: `Authenticated as ${user.name}.`,
        variant: 'success',
      });
      router.push('/admin');
    } catch (err) {
      setIsAuthenticating(false);
      toast({
        title: 'Sign-in failed',
        description: err instanceof Error ? err.message : 'Check your credentials and try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* LEFT COLUMN: Administrative Governance Showcase */}
      <div className="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-12 overflow-hidden border-r border-slate-800/80">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-indigo-950/40" />
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-xl shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight leading-none block">
                Trust Governance Console
              </span>
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-widest mt-1 block">
                Caldicott & Security Audit
              </span>
            </div>
          </Link>

          <Badge variant="outline" className="border-indigo-500/30 bg-indigo-950/40 text-indigo-300 text-xs px-3 py-1 gap-1.5 backdrop-blur-md">
            <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" />
            <span>Restricted Governance Gateway</span>
          </Badge>
        </div>

        {/* Center Statement */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Terminal className="h-3.5 w-3.5 text-indigo-400" />
            <span>Audit Trail & Registry Administration</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Information Governance. <br />
            <span className="bg-gradient-to-r from-indigo-300 via-blue-300 to-cyan-200 bg-clip-text text-transparent">
              Caldicott 256-Bit Audit Security.
            </span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            Dedicated administrative console for National Prostate Cancer Audit (NPCA) compliance audits, Caldicott Principle 7 emergency overrides, and multi-surgeon data management.
          </p>

          <div className="grid grid-cols-3 gap-3.5 pt-4">
            <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shadow-lg backdrop-blur-md">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                <div className="text-2xl font-black text-white font-mono">100%</div>
                <div className="text-[11px] text-slate-400 font-medium">Audit Trail Logging</div>
              </div>
            </div>

            <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shadow-lg backdrop-blur-md">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                <div className="text-2xl font-black text-indigo-300 font-mono">RBAC</div>
                <div className="text-[11px] text-slate-400 font-medium">Role Access Matrix</div>
              </div>
            </div>

            <div className="p-1 rounded-2xl bg-white/5 border border-white/10 shadow-lg backdrop-blur-md">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
                <div className="text-2xl font-black text-blue-300 font-mono">NPCA</div>
                <div className="text-[11px] text-slate-400 font-medium">Annual Audit Sync</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
              <span>Immutable Ledger</span>
            </span>
            <span>•</span>
            <span>ISO 27001 Certified</span>
            <span>•</span>
            <span>NHS Digital DSPT Standard Met</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">OUH-ADMIN-PORTAL</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Dedicated Admin Login Form */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 my-auto">
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Admin Authentication</span>
              <Link href="/login" className="text-xs text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1">
                <span>Doctor Login</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">System Admin Sign In</h2>
            <p className="text-xs text-slate-400">
              Restricted console for Database Administrators and Caldicott Information Governance Leads.
            </p>
          </div>

          <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[calc(2rem-0.375rem)] bg-slate-900/90 border border-white/5 p-6 space-y-4">
              <form onSubmit={(e) => void handleAdminLogin(e)} className="space-y-4">
                <FormField>
                  <FormLabel className="text-xs font-semibold text-slate-300">Admin Email / Staff ID</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="e.g. admin.ralp@nhs.net"
                      className="pl-10 bg-slate-950 border-slate-800 text-xs text-white h-11 rounded-xl focus:border-indigo-500"
                      required
                    />
                  </div>
                </FormField>

                <FormField>
                  <FormLabel className="text-xs font-semibold text-slate-300">Master Password</FormLabel>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-slate-950 border-slate-800 text-xs text-white h-11 rounded-xl focus:border-indigo-500"
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

                <Button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full h-11 rounded-xl gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 mt-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isAuthenticating ? 'Authorizing Console Access...' : 'Unlock Admin Console'}</span>
                </Button>
              </form>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-500">
            Oxford University Hospitals NHS FT • Information Governance
          </div>
        </div>
      </div>
    </div>
  );
}
