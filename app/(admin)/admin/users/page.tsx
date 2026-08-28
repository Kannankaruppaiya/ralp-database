'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Users, Plus, Mail, CheckCircle2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  surgeonCode: string;
  gmcNumber?: string;
  hospital: string;
  createdAt: string;
  deactivatedAt?: string | null;
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Consultant Surgeon',
    surgeonCode: '',
    gmcNumber: '',
    tempPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Row level security restricts this to Data Managers, so a non-admin sees an
  // error rather than a silently empty table.
  useEffect(() => {
    let active = true;
    supabase()
      .from('profiles')
      .select('*')
      .order('full_name')
      .then(({ data, error }: { data: Record<string, any>[] | null; error: { message: string } | null }) => {
        if (!active) return;
        if (error) {
          setLoadError(error.message);
        } else {
          setStaff(
            (data ?? []).map((r: Record<string, any>) => ({
              id: r.id,
              name: r.full_name,
              email: r.email,
              role: r.role,
              surgeonCode: r.surgeon_code ?? '—',
              gmcNumber: r.gmc_number ?? undefined,
              hospital: r.hospital,
              createdAt: r.created_at,
              deactivatedAt: r.deactivated_at ?? null,
            }))
          );
        }
        setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredStaff = staff.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q) || u.surgeonCode.toLowerCase().includes(q);
  });

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newUser.name,
          email: newUser.email,
          role: newUser.role,
          surgeonCode: newUser.surgeonCode || undefined,
          gmcNumber: newUser.gmcNumber || undefined,
          tempPassword: newUser.tempPassword,
        }),
      });
      const payload = await res.json();

      if (!res.ok) {
        toast({ title: 'Could not create the account', description: payload.error, variant: 'destructive' });
        return;
      }

      setStaff((prev) => [
        ...prev,
        {
          id: payload.id,
          name: payload.fullName,
          email: payload.email,
          role: payload.role,
          surgeonCode: newUser.surgeonCode || '—',
          gmcNumber: newUser.gmcNumber || undefined,
          hospital: 'Oxford University Hospitals NHS FT',
          createdAt: new Date().toISOString(),
          deactivatedAt: null,
        },
      ]);
      setIsInviteOpen(false);
      setNewUser({ name: '', email: '', role: 'Consultant Surgeon', surgeonCode: '', gmcNumber: '', tempPassword: '' });
      toast({
        title: 'Account created',
        description: `${payload.fullName} must change the temporary password at first sign-in.`,
        variant: 'success',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const setActive = async (id: string, active: boolean) => {
    const res = await fetch(`/api/admin/staff/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    const payload = await res.json();
    if (!res.ok) {
      toast({ title: 'Could not update the account', description: payload.error, variant: 'destructive' });
      return;
    }
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, deactivatedAt: payload.deactivatedAt } : s)));
    toast({ title: active ? 'Account reactivated' : 'Account deactivated', variant: 'success' });
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone. Deactivating keeps their record instead.`)) return;
    const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
    const payload = await res.json();
    if (!res.ok) {
      toast({ title: 'Could not delete the account', description: payload.error, variant: 'destructive' });
      return;
    }
    setStaff((prev) => prev.filter((s) => s.id !== id));
    toast({ title: 'Account deleted', variant: 'success' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Staff Administration"
        description="Provision Consultant Urologists, Lead Surgeons, CNS specialist nurses, and MDT coordinators"
        breadcrumbs={[
          { label: 'Admin Console', href: '/admin' },
          { label: 'User Management' },
        ]}
        action={
          <Button
            onClick={() => setIsInviteOpen(true)}
            size="sm"
            className="gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Invite Clinical Staff</span>
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search staff by name, email, role, or surgeon code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Name & GMC</TableHead>
              <TableHead>NHSmail</TableHead>
              <TableHead>Assigned Role</TableHead>
              <TableHead>Surgeon Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Provisioned</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.map((u) => (
              <TableRow key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                <TableCell className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                  <div>{u.name}</div>
                  {u.gmcNumber && (
                    <span className="text-[10px] font-mono text-slate-400">GMC: {u.gmcNumber}</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-slate-500 font-mono">
                  {u.email}
                </TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline">{u.role}</Badge>
                </TableCell>
                <TableCell className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                  {u.surgeonCode}
                </TableCell>
                <TableCell className="text-xs">
                  {u.deactivatedAt ? (
                    <Badge variant="secondary" className="bg-rose-500/10 text-rose-500 border-rose-500/20">
                      Deactivated
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString('en-GB')}
                </TableCell>
                <TableCell className="text-xs text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActive(u.id, !!u.deactivatedAt)}
                    className="text-xs h-7 px-2.5"
                  >
                    {u.deactivatedAt ? 'Reactivate' : 'Deactivate'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(u.id, u.name)}
                    className="text-xs h-7 px-2.5"
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-teal-600" />
              <span>Invite New Clinical Staff Member</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInviteUser} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name with Title</label>
              <Input
                placeholder="e.g. Mr. John Doe (FRCS Urol)"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">NHS Trust Email (@nhs.net)</label>
              <Input
                type="email"
                placeholder="e.g. john.doe@nhs.net"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="Consultant Surgeon">Consultant Surgeon</option>
                  <option value="Surgical Fellow / Registrar">Surgical Fellow / Registrar</option>
                  <option value="Clinical Nurse Specialist">Clinical Nurse Specialist</option>
                  <option value="MDT Coordinator">MDT Coordinator</option>
                  <option value="Data Manager">Data Manager</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Surgeon Code (if applicable)</label>
                <Input
                  placeholder="e.g. JD"
                  value={newUser.surgeonCode}
                  onChange={(e) => setNewUser({ ...newUser, surgeonCode: e.target.value.toUpperCase() })}
                  maxLength={4}
                  className="mt-1 text-xs font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">GMC Number</label>
              <Input
                placeholder="e.g. 7412589"
                value={newUser.gmcNumber}
                onChange={(e) => setNewUser({ ...newUser, gmcNumber: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Temporary Password
              </label>
              <Input
                type="text"
                placeholder="At least 12 characters"
                value={newUser.tempPassword}
                onChange={(e) => setNewUser({ ...newUser, tempPassword: e.target.value })}
                minLength={12}
                required
                className="mt-1"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Give this to the clinician directly. They must change it at first sign-in.
              </p>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs" disabled={isSubmitting}>
                Dispatch Invitation
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </div>
  );
}
