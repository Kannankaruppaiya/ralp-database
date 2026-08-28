'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField, FormLabel } from '@/components/ui/form';
import { ShieldCheck, Lock, Eye, EyeOff, KeyRound, HeartPulse, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 12) {
      toast({ title: 'Password too short', description: 'Your password must be at least 12 characters.', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Passwords do not match', description: 'The two passwords do not match. Please retype carefully.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast({ title: 'Could not set the password', description: payload.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Password updated successfully', description: 'Your account is secured. Welcome to the registry.', variant: 'success' });
      router.push('/dashboard');
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const isLongEnough = password.length >= 12;
  const isMatching = confirm.length > 0 && password === confirm;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white p-6 sm:p-10">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-tight leading-none block">
              RALP Database
            </span>
            <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-widest mt-0.5 block">
              Clinical Registry
            </span>
          </div>
        </Link>

        <Badge variant="outline" className="border-teal-500/30 bg-teal-950/40 text-teal-300 text-[11px] px-2.5 py-1 gap-1 backdrop-blur-md">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
          <span>Mandatory Security Setup</span>
        </Badge>
      </div>

      {/* Center Card */}
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        <div className="space-y-1.5 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 mx-auto shadow-inner">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Set Your Permanent Password</h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            Your account was provisioned with a temporary password. Choose a confidential master password known only to you before proceeding.
          </p>
        </div>

        {/* Double-Bezel Card Container */}
        <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="rounded-[calc(2rem-0.375rem)] bg-slate-900/90 border border-white/5 p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField>
                <FormLabel className="text-xs font-semibold text-slate-300">New Password (min 12 characters)</FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new permanent password"
                    minLength={12}
                    required
                    className="pl-10 pr-10 bg-slate-950 border-slate-800 text-xs text-white h-11 rounded-xl focus:border-teal-500"
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

              <FormField>
                <FormLabel className="text-xs font-semibold text-slate-300">Confirm New Password</FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm your password"
                    minLength={12}
                    required
                    className="pl-10 pr-10 bg-slate-950 border-slate-800 text-xs text-white h-11 rounded-xl focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              {/* Password Requirements Checklist */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] space-y-1 text-slate-400">
                <div className={`flex items-center gap-1.5 ${isLongEnough ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`h-3.5 w-3.5 ${isLongEnough ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>At least 12 characters long</span>
                </div>
                <div className={`flex items-center gap-1.5 ${isMatching ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  <CheckCircle2 className={`h-3.5 w-3.5 ${isMatching ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>Both passwords match</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full h-11 rounded-xl gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-600/25 mt-2"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{isSaving ? 'Securing Account...' : 'Set Permanent Password & Enter Registry'}</span>
              </Button>
            </form>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500">
          Oxford University Hospitals NHS FT • Caldicott Identity Verification
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-600">
        All surgical actions and reviews are permanently attributed under UK Caldicott Principle 7.
      </div>
    </div>
  );
}
