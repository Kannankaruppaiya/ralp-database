'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormField, FormLabel } from '@/components/ui/form';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
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
    <div className="min-h-[100dvh] grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#121212] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600 selection:text-white">
      {/* LEFT COLUMN: Administrative Governance Showcase */}
      <div className="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-12 overflow-hidden border-r border-slate-200 dark:border-[#272727] bg-[#121212]">
        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 group-hover:bg-indigo-500 transition-colors">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-white text-lg tracking-tight leading-none block">
                Trust Governance Console
              </span>
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mt-1 block">
                Caldicott & Security Audit
              </span>
            </div>
          </Link>

          <Badge variant="outline" className="border-[#272727] bg-[#181818] text-indigo-300 text-xs px-3 py-1 gap-1.5 backdrop-blur-md">
            <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" />
            <span>Restricted Governance Gateway</span>
          </Badge>
        </div>

        {/* Center Statement */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181818] border border-[#272727] text-indigo-300 text-[11px] font-semibold uppercase tracking-wider">
            <Terminal className="h-3.5 w-3.5 text-indigo-400" />
            <span>Audit Trail & Registry Administration</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight leading-[1.15] [text-wrap:balance]">
            Information Governance.{' '}
            <span className="hero-gradient-text block">
              Caldicott 256-Bit Audit Security.
            </span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-xl [text-wrap:pretty]">
            Dedicated administrative console for National Prostate Cancer Audit (NPCA) compliance audits, Caldicott Principle 7 emergency overrides, and multi-surgeon data management.
          </p>

          <div className="grid grid-cols-3 gap-3.5 pt-4">
            <div className="p-4 rounded-xl bg-[#181818] border border-[#272727] space-y-1">
              <div className="text-2xl font-bold text-white font-mono [font-variant-numeric:tabular-nums]">100%</div>
              <div className="text-[11px] text-slate-400 font-medium">Audit Trail Logging</div>
            </div>

            <div className="p-4 rounded-xl bg-[#181818] border border-[#272727] space-y-1">
              <div className="text-2xl font-bold text-indigo-300 font-mono [font-variant-numeric:tabular-nums]">RBAC</div>
              <div className="text-[11px] text-slate-400 font-medium">Role Access Matrix</div>
            </div>

            <div className="p-4 rounded-xl bg-[#181818] border border-[#272727] space-y-1">
              <div className="text-2xl font-bold text-blue-300 font-mono [font-variant-numeric:tabular-nums]">NPCA</div>
              <div className="text-[11px] text-slate-400 font-medium">Annual Audit Sync</div>
            </div>
          </div>
        </div>

        {/* Bottom Trust */}
        <div className="relative z-10 pt-6 border-t border-[#272727] flex items-center justify-between text-xs text-slate-400">
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
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-white dark:bg-[#121212] min-h-[100dvh] lg:min-h-full">
        {/* Top bar with ThemeToggle */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-[#272727]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-base">Trust Console</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Admin Authentication</span>
              <Link href="/login" className="text-xs text-teal-600 dark:text-teal-400 hover:underline transition-colors flex items-center gap-1">
                <span>Doctor Login</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">System Admin Sign In</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 [text-wrap:pretty]">
              Restricted console for Database Administrators and Caldicott Information Governance Leads.
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] p-6 space-y-4 shadow-sm">
            <form onSubmit={(e) => void handleAdminLogin(e)} className="space-y-4">
              <FormField>
                <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">Admin Email / Staff ID</FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="e.g. admin.ralp@nhs.net"
                    className="pl-10 text-xs h-10 rounded-xl"
                    required
                  />
                </div>
              </FormField>

              <FormField>
                <FormLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">Master Password</FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 text-xs h-10 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              <Button
                type="submit"
                disabled={isAuthenticating}
                className="w-full h-10 rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm mt-2"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{isAuthenticating ? 'Authorizing Console Access...' : 'Unlock Admin Console'}</span>
              </Button>
            </form>
          </div>

          <div className="text-center text-[11px] text-slate-500">
            Oxford University Hospitals NHS FT • Information Governance
          </div>
        </div>

        <div className="hidden lg:block text-center text-[11px] text-slate-400 pt-6">
          Authorized hospital governance access only • Oxford University Hospitals NHS Trust
        </div>
      </div>
    </div>
  );
}
