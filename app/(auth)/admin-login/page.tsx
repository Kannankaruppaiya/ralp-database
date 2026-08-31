'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  UserCheck,
  Terminal,
} from 'lucide-react';
import { signIn, signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { APP_CONFIG } from '@/config/environment';
import { AuthShell, AuthField, AuthSubmit } from '@/components/auth/auth-shell';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [adminEmail, setAdminEmail] = useState(APP_CONFIG.showDemoHelpers ? 'admin.ralp@nhs.net' : '');
  const [password, setPassword] = useState('');
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
      toast({ title: 'Administrator access granted', description: `Authenticated as ${user.name}.`, variant: 'success' });
      router.push('/admin');
    } catch (err) {
      setIsAuthenticating(false);
      toast({ title: 'Sign-in failed', description: err instanceof Error ? err.message : 'Check your credentials and try again.', variant: 'destructive' });
    }
  };

  const handleAutofillAdmin = (type: 'admin' | 'caldicott') => {
    setAdminEmail(type === 'admin' ? 'admin.ralp@nhs.net' : 'm.roberts@nhs.net'); // audit-ok: demo preset, gated by showDemoHelpers
  };

  return (
    <AuthShell
      accent="admin"
      brandIcon={ShieldCheck}
      brandTitle="Trust Governance Console"
      brandSubtitle="Caldicott & Security Audit"
      eyebrow="Audit Trail & Registry Administration"
      eyebrowIcon={Terminal}
      headline="Information governance, Caldicott-grade audit security."
      description="Dedicated console for NPCA compliance audits, Caldicott Principle 7 overrides and multi-surgeon data management."
      stats={[
        { value: '100%', label: 'Audit Trail Logging' },
        { value: 'RBAC', label: 'Role Access Matrix' },
        { value: 'NPCA', label: 'Annual Audit Sync' },
      ]}
      trust={['Immutable Ledger', 'ISO 27001', 'NHS DSPT Standard']}
      portalLinks={[{ href: '/login', label: 'Doctor' }]}
      formTitle="System Admin Sign In"
      formSubtitle="Admin Authentication"
      footer="Oxford University Hospitals NHS FT · Information Governance · Restricted governance gateway."
    >
      <form onSubmit={(e) => void handleAdminLogin(e)} className="space-y-4">
        <AuthField
          label="Admin Email / Staff ID"
          icon={Mail}
          type="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          placeholder="e.g. admin.ralp@nhs.net"
          autoComplete="username"
          required
        />
        <AuthField
          label="Master Password"
          icon={Lock}
          reveal
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {APP_CONFIG.showDemoHelpers && (
          <div className="pt-1">
            <div className="mb-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <UserCheck className="h-3 w-3 text-admin" aria-hidden="true" />
              <span>Demo autofill · non-production only</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleAutofillAdmin('admin')}
                className="rounded-lg border border-border bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:border-admin/40 hover:bg-admin/10 hover:text-admin focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                System Admin (Alex Ward)
              </button>
              <button
                type="button"
                onClick={() => handleAutofillAdmin('caldicott')}
                className="rounded-lg border border-border bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:border-admin/40 hover:bg-admin/10 hover:text-admin focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Caldicott Lead (Dr. Roberts)
              </button>
            </div>
          </div>
        )}

        <AuthSubmit type="submit" icon={ShieldCheck} disabled={isAuthenticating}>
          {isAuthenticating ? 'Authorising console access…' : 'Unlock admin console'}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
