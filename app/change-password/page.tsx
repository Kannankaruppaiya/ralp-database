'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: 'The two passwords do not match.', variant: 'destructive' });
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
      toast({ title: 'Password updated', variant: 'success' });
      router.push('/dashboard');
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">Set your password</h1>
      <p className="mt-2 text-sm text-slate-500">
        Your account was created with a temporary password. Choose one only you know before
        continuing — the registry attributes every record to the person signed in.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-semibold">New password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={12}
            required
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-semibold">Confirm new password</label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={12}
            required
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? 'Saving…' : 'Set password and continue'}
        </Button>
      </form>
    </main>
  );
}
