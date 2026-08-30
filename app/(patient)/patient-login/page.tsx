'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  ShieldCheck,
  Smartphone,
  FileHeart,
  Mail,
  Calendar,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { signIn } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { AuthShell, AuthTabs, AuthField, AuthSubmit, useAuthAccent } from '@/components/auth/auth-shell';

export default function PatientLoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [authMode, setAuthMode] = useState<'nhs_number' | 'sms_token'>('nhs_number');
  const [smsOtp, setSmsOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /**
   * Patients sign in with the credentials their clinical team issued. Knowing
   * an NHS number (an identifier, not a secret) must never grant access.
   */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');
    try {
      const user = await signIn(email, password);
      toast({ title: `Welcome back, ${user.name}`, description: 'Opening your recovery dashboard.', variant: 'success' });
      router.push('/home');
    } catch (err) {
      setIsVerifying(false);
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please check your details.');
    }
  };

  const handleSendOtp = () => {
    toast({ title: 'SMS sign-in unavailable', description: 'NHS Notify is not enabled for this deployment. Please sign in with your email and password.', variant: 'destructive' });
  };

  return (
    <AuthShell
      accent="category"
      brandIcon={FileHeart}
      brandTitle="My Prostate Recovery"
      brandSubtitle="Oxford Patient Outcomes Portal"
      eyebrow="Personalised Recovery Tracking"
      eyebrowIcon={Activity}
      headline="Your recovery journey, connected to your care team."
      description="Complete your confidential follow-up questionnaires — IPSS urinary scores, continence recovery and SHIM wellness — from the comfort of home."
      stats={[
        { value: '6wk', label: 'Catheter TWOC' },
        { value: '12mo', label: 'Potency & PSA' },
        { value: '36mo', label: 'Long-Term Care' },
      ]}
      trust={['Strictly Confidential', 'NHS Identity Verified', 'Care Team Sync']}
      portalLinks={[{ href: '/login', label: 'Staff' }]}
      formTitle="Patient Login"
      formSubtitle="Patient Portal Sign In"
      footer="Oxford University Hospitals NHS Foundation Trust · Urology Registry · NHS Caldicott Protected."
    >
      <div className="space-y-5">
        <AuthTabs
          value={authMode}
          onChange={setAuthMode}
          options={[
            { value: 'nhs_number', label: 'Email & Password', icon: Mail },
            { value: 'sms_token', label: 'SMS Magic Code', icon: Smartphone },
          ]}
        />

        {error && (
          <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {authMode === 'nhs_number' ? (
          <form onSubmit={(e) => void handleSignIn(e)} className="space-y-4">
            <AuthField
              label="Email Address"
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="the address your clinical team registered"
              autoComplete="username"
              required
            />
            <AuthField
              label="Password"
              icon={Calendar}
              reveal
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <AuthSubmit type="submit" icon={Lock} disabled={isVerifying}>
              {isVerifying ? 'Verifying identity…' : 'Access my recovery record'}
            </AuthSubmit>
          </form>
        ) : (
          <SmsPanel otp={smsOtp} setOtp={setSmsOtp} onSend={handleSendOtp} />
        )}
      </div>
    </AuthShell>
  );
}

function SmsPanel({ otp, setOtp, onSend }: { otp: string; setOtp: (v: string) => void; onSend: () => void }) {
  const a = useAuthAccent();
  return (
    <div className="space-y-4 py-1 text-center">
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${a.softBg} ${a.text} ring-1 ${a.softBorder}`}>
        <Smartphone className="h-7 w-7" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-foreground">NHS Notify SMS authentication</h3>
        <p className="mt-1 text-xs text-muted-foreground">A one-time 6-digit code is sent to your registered mobile number.</p>
      </div>
      <div className="space-y-1.5 text-left">
        <label htmlFor="sms-otp" className="text-xs font-semibold text-foreground">6-digit security code</label>
        <input
          id="sms-otp"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="------"
          inputMode="numeric"
          maxLength={6}
          className={`h-12 w-full rounded-xl border border-input bg-background text-center font-mono text-xl font-bold tracking-[0.4em] shadow-sm focus-visible:outline-none focus-visible:ring-2 ${a.focus}`}
        />
      </div>
      <AuthSubmit type="button" icon={Smartphone} onClick={onSend}>
        Send 6-digit code to my phone
      </AuthSubmit>
    </div>
  );
}
