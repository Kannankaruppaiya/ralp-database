'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Mail, Search, Users, ShieldCheck, UserCheck, Stethoscope, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [roleFilter, setRoleFilter] = useState('ALL');
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

  // The route is admin-gated server-side (requireAdmin); the browser never
  // queries the database directly.
  useEffect(() => {
    let active = true;
    fetch('/api/admin/staff')
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!active) return;
        if (!res.ok) {
          setLoadError(body?.error ?? 'Could not load the staff list.');
        } else {
          setStaff(
            ((body?.staff ?? []) as Record<string, any>[]).map((r) => ({
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
      })
      .catch(() => {
        if (!active) return;
        setLoadError('Could not load the staff list.');
        setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const totalStaff = staff.length;
  const activeSurgeons = staff.filter((s) => s.role.includes('Surgeon') && !s.deactivatedAt).length;
  const activeNurses = staff.filter((s) => s.role.includes('Nurse') && !s.deactivatedAt).length;
  const dataManagers = staff.filter((s) => s.role.includes('Manager') && !s.deactivatedAt).length;

  const filteredStaff = staff.filter((u) => {
    if (roleFilter === 'SURGEONS' && !u.role.includes('Surgeon')) return false;
    if (roleFilter === 'NURSES' && !u.role.includes('Nurse')) return false;
    if (roleFilter === 'MANAGERS' && !u.role.includes('Manager')) return false;
    if (roleFilter === 'DEACTIVATED' && !u.deactivatedAt) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.surgeonCode.toLowerCase().includes(q)
      );
    }
    return true;
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
            className="gap-1.5 shadow-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>Invite Clinical Staff</span>
          </Button>
        }
      />

      {/* Staff Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Provisioned</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white font-mono [font-variant-numeric:tabular-nums]">
                {isLoading ? '—' : totalStaff}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Active Surgeons</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white font-mono [font-variant-numeric:tabular-nums]">
                {isLoading ? '—' : activeSurgeons}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Stethoscope className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Specialist Nurses</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white font-mono [font-variant-numeric:tabular-nums]">
                {isLoading ? '—' : activeNurses}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Governance Leads</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white font-mono [font-variant-numeric:tabular-nums]">
                {isLoading ? '—' : dataManagers}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
              <Lock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Role Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <Tabs value={roleFilter} onValueChange={setRoleFilter} className="w-full sm:w-auto">
            <TabsList className="bg-[#181818] border border-[#272727]">
              <TabsTrigger value="ALL">All Accounts ({totalStaff})</TabsTrigger>
              <TabsTrigger value="SURGEONS">Surgeons ({activeSurgeons})</TabsTrigger>
              <TabsTrigger value="NURSES">Nurses ({activeNurses})</TabsTrigger>
              <TabsTrigger value="MANAGERS">Managers ({dataManagers})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filter by name, email, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Staff Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-[#272727] dark:bg-[#181818]">
          <Table>
            <TableHeader className="bg-slate-50/90 dark:bg-[#121212]/90 backdrop-blur-sm">
              <TableRow className="border-b border-slate-200 dark:border-[#272727]">
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
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-sm text-slate-500">
                    {isLoading ? 'Loading staff records…' : loadError ? `Error: ${loadError}` : 'No clinical staff accounts found.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((u) => {
                  const initials = u.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
                  const isSurgeon = u.role.includes('Surgeon');
                  const isManager = u.role.includes('Manager');

                  return (
                    <TableRow key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1F1F1F]/60 transition-colors duration-200 border-b border-slate-100 dark:border-[#272727]">
                      <TableCell className="font-semibold text-xs text-slate-900 dark:text-slate-100 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 font-bold text-xs border border-teal-200/60 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/60">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">{u.name}</div>
                            {u.gmcNumber && (
                              <span className="text-[10px] font-mono text-slate-400 [font-variant-numeric:tabular-nums]">GMC: {u.gmcNumber}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {u.email}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className={`font-semibold ${
                          isSurgeon
                            ? 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/60'
                            : isManager
                            ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60'
                            : 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60'
                        }`}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                        {u.surgeonCode}
                      </TableCell>
                      <TableCell className="text-xs">
                        {u.deactivatedAt ? (
                          <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-semibold">
                            Deactivated
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60 font-semibold">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 [font-variant-numeric:tabular-nums]">
                        {new Date(u.createdAt).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell className="text-xs text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActive(u.id, !!u.deactivatedAt)}
                          className="text-xs h-7 px-2.5 font-semibold"
                        >
                          {u.deactivatedAt ? 'Reactivate' : 'Deactivate'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => remove(u.id, u.name)}
                          className="text-xs h-7 px-2.5 font-semibold"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2 font-bold text-slate-900 dark:text-white">
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
                className="mt-1 text-xs rounded-xl"
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
                className="mt-1 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm dark:border-[#272727] dark:bg-[#181818] dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Consultant Surgeon">Consultant Surgeon</option>
                  <option value="Surgical Registrar">Surgical Registrar / Fellow</option>
                  <option value="Clinical Nurse Specialist">Clinical Nurse Specialist (CNS)</option>
                  <option value="MDT Coordinator">MDT Coordinator / Data Clerk</option>
                  <option value="Caldicott Guardian">Caldicott Guardian / IG Lead</option>
                  <option value="Data Manager">Data Manager / System Admin</option>
                  <option value="Research Auditor">Research Auditor / Fellow</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Surgeon Code (if applicable)</label>
                <Input
                  placeholder="e.g. JD"
                  value={newUser.surgeonCode}
                  onChange={(e) => setNewUser({ ...newUser, surgeonCode: e.target.value.toUpperCase() })}
                  maxLength={8}
                  className="mt-1 text-xs font-mono uppercase rounded-xl"
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Any code you enter here joins the surgeon roster — no deployment needed.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">GMC Number</label>
              <Input
                placeholder="e.g. 7412589"
                value={newUser.gmcNumber}
                onChange={(e) => setNewUser({ ...newUser, gmcNumber: e.target.value })}
                className="mt-1 text-xs rounded-xl font-mono [font-variant-numeric:tabular-nums]"
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
                className="mt-1 text-xs rounded-xl"
              />
              <p className="mt-1 text-[11px] text-slate-500 [text-wrap:pretty]">
                Give this to the clinician directly. They must change it at first sign-in.
              </p>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-[#272727]">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen(false)} className="text-xs font-semibold">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs font-semibold" disabled={isSubmitting}>
                Dispatch Invitation
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </div>
  );
}
