'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  HeartPulse,
  Lock,
  ShieldCheck,
  CreditCard,
  Mail,
  KeyRound,
  Cpu,
  UserCheck,
} from 'lucide-react';
import { signIn } from '@/lib/auth';
import { Role } from '@/config/permissions';
import { SurgeonCode } from '@/types/common';
import { useToast } from '@/hooks/use-toast';
import { AuthShell, AuthTabs, AuthField, AuthSubmit, useAuthAccent } from '@/components/auth/auth-shell';

interface DemoUser {
  name: string;
  role: Role;
  surgeonCode?: SurgeonCode;
  email: string;
  department: string;
  initials: string;
}

const PRESET_ACCOUNTS: DemoUser[] = [
  { name: 'Mr. V. Kannan', role: 'Consultant Surgeon', surgeonCode: 'VK', email: 'v.kannan@nhs.net', department: 'Robotic Pelvic Oncology Lead', initials: 'VK' },
  { name: 'Mr. R. D. MacDonagh', role: 'Consultant Surgeon', surgeonCode: 'RDM', email: 'r.macdonagh@nhs.net', department: 'Consultant Urological Surgeon', initials: 'RM' },
  { name: 'Dr. Sarah Jenkins', role: 'Surgical Registrar', email: 's.jenkins@nhs.net', department: 'Urology Specialist Registrar', initials: 'SJ' },
  { name: 'Sister Claire Evans', role: 'Clinical Nurse Specialist', email: 'c.evans@nhs.net', department: 'Robotic Prostate Cancer Specialist Nurse', initials: 'CE' },
];

export default function ClinicianLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [authTab, setAuthTab] = useState<'credentials' | 'smartcard'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const executeLogin = async (methodTitle: string) => {
    setIsAuthenticating(true);
    try {
      const user = await signIn(email, password);
      toast({ title: `Welcome, ${user.name}`, description: `Authenticated via ${methodTitle} as ${user.role}.`, variant: 'success' });
      router.push(searchParams.get('next') || '/dashboard');
    } catch (err) {
      setIsAuthenticating(false);
      toast({ title: 'Sign-in failed', description: err instanceof Error ? err.message : 'Check your credentials and try again.', variant: 'destructive' });
    }
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    void executeLogin('NHS.net credentials');
  };

  const handleSmartcardTap = () => {
    toast({ title: 'Smartcard sign-in unavailable', description: 'NHS CIS2 federation is not enabled. Use your NHS.net email and password.', variant: 'destructive' });
  };

  const handleAutofill = (acc: DemoUser) => {
    setEmail(acc.email);
    toast({ title: 'Email filled', description: `Enter the password for ${acc.name}.`, variant: 'default' });
  };

  return (
    <AuthShell
      accent="primary"
      brandIcon={HeartPulse}
      brandTitle="RALP Database v2"
      brandSubtitle="Clinical Registry"
      eyebrow="Doctor & Surgical Staff Access"
      eyebrowIcon={Cpu}
      headline="Precision robotics, standardised clinical excellence."
      description="Secure sign-in for Urology Consultants, Surgeons, Registrars and Specialist Nurses to manage patient oncology profiles and theatre outcomes."
      stats={[
        { value: 'NHS', label: 'Secure Cloud Registry' },
        { value: '94.2%', label: '12-Month Trifecta' },
        { value: '98.0%', label: 'NPCA Compliance' },
      ]}
      trust={['Caldicott Principle 7', 'NHS Smartcard Enabled', '256-bit AES']}
      portalLinks={[{ href: '/patient-login', label: 'Patient' }, { href: '/admin-login', label: 'Admin' }]}
      formTitle="Doctor & Staff Login"
      formSubtitle="Clinician Sign In"
      footer="Oxford University Hospitals NHS FT · Department of Urology · Access governed under Caldicott Information Governance Protocols."
    >
      <div className="space-y-5">
        <AuthTabs
          value={authTab}
          onChange={setAuthTab}
          options={[
            { value: 'credentials', label: 'NHS.net Email', icon: KeyRound },
            { value: 'smartcard', label: 'NHS Smartcard', icon: CreditCard },
          ]}
        />

        {authTab === 'credentials' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <AuthField
              label="NHS.net Email Address"
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. v.kannan@nhs.net"
              autoComplete="username"
              required
            />
            <AuthField
              label="Password"
              icon={Lock}
              reveal
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              labelRight={
                <Link href="/forgot-password" className="text-[11px] font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              }
            />

            <div className="pt-1">
              <div className="mb-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <UserCheck className="h-3 w-3 text-primary" aria-hidden="true" />
                <span>Quick autofill test account</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleAutofill(acc)}
                    className="rounded-lg border border-border bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {acc.name} ({acc.surgeonCode || acc.initials})
                  </button>
                ))}
              </div>
            </div>

            <AuthSubmit type="submit" icon={Lock} disabled={isAuthenticating}>
              {isAuthenticating ? 'Authenticating session…' : 'Sign in to clinical registry'}
            </AuthSubmit>
          </form>
        ) : (
          <SmartcardPanel onTap={handleSmartcardTap} />
        )}
      </div>
    </AuthShell>
  );
}

function SmartcardPanel({ onTap }: { onTap: () => void }) {
  const a = useAuthAccent();
  return (
    <div className="space-y-4 py-2 text-center">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${a.softBg} ${a.text} ring-1 ${a.softBorder}`}>
        <CreditCard className="h-8 w-8 animate-pulse" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-foreground">NHS Care Identity Service (CIS2)</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Tap your physical Smartcard on the connected USB reader.</p>
      </div>
      <div className="space-y-1 rounded-xl border border-border bg-muted p-3 text-left font-mono text-xs text-muted-foreground">
        <div className="flex items-center justify-between text-[10px]">
          <span>READER STATUS</span>
          <span className="font-bold text-success">READY ●</span>
        </div>
        <div className="text-foreground">Device: Omnikey 3121 USB Smartcard Reader</div>
        <div className={a.text}>Active: Mr. V. Kannan (Consultant Surgeon)</div>
      </div>
      <AuthSubmit type="button" icon={ShieldCheck} onClick={onTap}>
        Simulate Smartcard sign in
      </AuthSubmit>
    </div>
  );
}
