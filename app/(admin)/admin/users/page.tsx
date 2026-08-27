'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Users, Plus, Mail, CheckCircle2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  surgeonCode: string;
  gmcNumber?: string;
  twoFactor: boolean;
  status: 'Active' | 'Pending' | 'Suspended';
}

const INITIAL_STAFF: UserRecord[] = [
  { id: '1', name: 'Mr. V. Kannan', email: 'v.kannan@nhs.net', role: 'Consultant Surgeon', surgeonCode: 'VK', gmcNumber: '6123456', twoFactor: true, status: 'Active' },
  { id: '2', name: 'Mr. R. D. Miller', email: 'r.miller@nhs.net', role: 'Consultant Surgeon', surgeonCode: 'RDM', gmcNumber: '4891023', twoFactor: true, status: 'Active' },
  { id: '3', name: 'Mr. C. Ibrahim', email: 'c.ibrahim@nhs.net', role: 'Consultant Surgeon', surgeonCode: 'CI', gmcNumber: '5782910', twoFactor: true, status: 'Active' },
  { id: '4', name: 'Mr. O. A. Khan', email: 'o.khan@nhs.net', role: 'Consultant Surgeon', surgeonCode: 'OAK', gmcNumber: '6901234', twoFactor: true, status: 'Active' },
  { id: '5', name: 'Sister Sarah Jenkins', email: 's.jenkins@nhs.net', role: 'Clinical Nurse Specialist', surgeonCode: '—', twoFactor: true, status: 'Active' },
  { id: '6', name: 'David Evans', email: 'd.evans@nhs.net', role: 'Caldicott Guardian / Data Manager', surgeonCode: '—', twoFactor: true, status: 'Active' },
  { id: '7', name: 'Dr. Emily Thornton', email: 'e.thornton@nhs.net', role: 'MDT Coordinator', surgeonCode: '—', twoFactor: false, status: 'Pending' },
];

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<UserRecord[]>(INITIAL_STAFF);
  const [search, setSearch] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Consultant Surgeon', surgeonCode: '' });

  const filteredStaff = staff.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q) || u.surgeonCode.toLowerCase().includes(q);
  });

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const created: UserRecord = {
      id: `usr-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      surgeonCode: newUser.surgeonCode || '—',
      twoFactor: false,
      status: 'Pending',
    };

    setStaff((prev) => [created, ...prev]);
    setIsInviteOpen(false);
    setNewUser({ name: '', email: '', role: 'Consultant Surgeon', surgeonCode: '' });

    toast({
      title: 'NHS Smartcard / NHSmail Invite Dispatched',
      description: `Sent registry access activation link to ${created.email}`,
      variant: 'default',
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
              <TableHead>2FA Status</TableHead>
              <TableHead>Account Status</TableHead>
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
                <TableCell>
                  {u.twoFactor ? (
                    <Badge variant="success" className="text-[10px] gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Enforced</span>
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="text-[10px]">
                      Pending Setup
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={u.status === 'Active' ? 'success' : 'warning'}
                    className="text-[10px]"
                  >
                    {u.status}
                  </Badge>
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
