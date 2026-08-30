'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROLE_PERMISSIONS } from '@/config/permissions';
import { ShieldCheck, Check, X, KeyRound } from 'lucide-react';

export default function AdminRolesPage() {
  const roles = Object.entries(ROLE_PERMISSIONS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role-Based Access Control (RBAC) Matrix"
        description="NHS Information Governance permission tiers across surgical consultants, oncology nurses, MDT clerks, and patients"
        breadcrumbs={[
          { label: 'Admin Console', href: '/admin' },
          { label: 'Role Permissions' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {roles.map(([roleName, perms]) => (
          <Card key={roleName} className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>{roleName}</span>
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                {Object.values(perms).filter(Boolean).length} Permissions Enabled
              </Badge>
            </CardHeader>

            <CardContent className="p-4 space-y-2 text-xs">
              {Object.entries(perms).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  {val ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium font-mono text-[11px]">
                      <Check className="h-3.5 w-3.5" />
                      <span>Allowed</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                      <X className="h-3.5 w-3.5" />
                      <span>Denied</span>
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
