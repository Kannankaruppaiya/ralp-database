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
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Consultant Surgeon', surgeonCode: '' });

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

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    // Creating a login requires the service role key, which must never reach the
    // browser. Until a server-side invite route exists, accounts are provisioned
    // from the Supabase dashboard.
    setIsInviteOpen(false);
    toast({
      title: 'Invites are not wired up yet',
      description: 'Create the account in the Supabase dashboard; the profile row is created automatically.',
      variant: 'destructive',
    });
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
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff by name, email, role, or surgeon code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Name & GMC</TableHead>
              <TableHead>NHSmail</TableHead>
              <TableHead>Assigned Role</TableHead>
              <TableHead>Surgeon Code</TableHead>
              <TableHead>GMC Number</TableHead>
              <TableHead>Provisioned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.map((u) => (
              <TableRow key={u.id} className="hover:bg-muted/80 dark:hover:bg-slate-800/50">
                <TableCell className="font-semibold text-xs text-foreground dark:text-slate-100">
                  <div>{u.name}</div>
                  {u.gmcNumber && (
                    <span className="text-[10px] font-mono text-muted-foreground">GMC: {u.gmcNumber}</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {u.email}
                </TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline">{u.role}</Badge>
                </TableCell>
                <TableCell className="text-xs font-mono font-bold text-primary dark:text-teal-400">
                  {u.surgeonCode}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {u.gmcNumber ?? '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString('en-GB')}
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
              <Mail className="h-4 w-4 text-primary" />
              <span>Invite New Clinical Staff Member</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInviteUser} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground dark:text-slate-300">Full Name with Title</label>
              <Input
                placeholder="e.g. Mr. John Doe (FRCS Urol)"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground dark:text-slate-300">NHS Trust Email (@nhs.net)</label>
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
                <label className="text-xs font-semibold text-foreground dark:text-slate-300">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="Consultant Surgeon">Consultant Surgeon</option>
                  <option value="Surgical Fellow / Registrar">Surgical Fellow / Registrar</option>
                  <option value="Clinical Nurse Specialist">Clinical Nurse Specialist</option>
                  <option value="MDT Coordinator">MDT Coordinator</option>
                  <option value="Data Manager">Data Manager</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground dark:text-slate-300">Surgeon Code (if applicable)</label>
                <Input
                  placeholder="e.g. JD"
                  value={newUser.surgeonCode}
                  onChange={(e) => setNewUser({ ...newUser, surgeonCode: e.target.value.toUpperCase() })}
                  maxLength={4}
                  className="mt-1 text-xs font-mono uppercase"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs">
                Dispatch Invitation
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </div>
  );
}
