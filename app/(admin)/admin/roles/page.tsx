'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ROLE_PERMISSIONS } from '@/config/permissions';
import { ShieldCheck, Check, X, UserCheck } from 'lucide-react';

export default function AdminRolesPage() {
  const roles = Object.entries(ROLE_PERMISSIONS);
  const [selectedRole, setSelectedRole] = useState<string>(roles[0][0]);

  const activeRolePermissions = (ROLE_PERMISSIONS[selectedRole as keyof typeof ROLE_PERMISSIONS] || {}) as unknown as Record<string, boolean>;

  const categories = [
    {
      name: 'Clinical Patient Records',
      permissions: ['canViewIdentifiable', 'canEditClinical', 'canDeletePatient'],
    },
    {
      name: 'Surgical & Operative Logging',
      permissions: ['canLogOperations', 'canUploadDocuments', 'canApproveOCR'],
    },
    {
      name: 'Functional PROMs & Messaging',
      permissions: ['canDispatchPROMs', 'canViewPROMs', 'canExportPseudonymised'],
    },
    {
      name: 'Information Governance & Exports',
      permissions: ['canExportIdentifiable', 'canViewAuditLogs', 'canManageStaff', 'canConfigureSystem'],
    },
  ];

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

      <Tabs defaultValue="grid" className="space-y-6">
        <TabsList className="bg-[#181818] border border-[#272727]">
          <TabsTrigger value="grid">Complete Role Matrix</TabsTrigger>
          <TabsTrigger value="simulator">Interactive Role Inspector</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {roles.map(([roleName, perms]) => (
              <Card key={roleName} className="border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
                <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-[#272727] flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <span>{roleName}</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono [font-variant-numeric:tabular-nums]">
                    {Object.values(perms).filter(Boolean).length} Permissions Enabled
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 space-y-2 text-xs">
                  {Object.entries(perms).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 dark:border-[#272727]">
                      <span className="text-slate-700 dark:text-slate-300 capitalize font-medium">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      {val ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium font-mono text-[11px]">
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
        </TabsContent>

        <TabsContent value="simulator" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left selector */}
            <div className="md:col-span-4 space-y-2">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Select Clinical Role</div>
              {roles.map(([roleName, perms]) => {
                const isSelected = selectedRole === roleName;
                const enabledCount = Object.values(perms).filter(Boolean).length;
                return (
                  <button
                    key={roleName}
                    type="button"
                    onClick={() => setSelectedRole(roleName)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-50 border-teal-500 text-teal-950 dark:bg-[#1F1F1F] dark:border-teal-400 dark:text-white font-bold'
                        : 'bg-white border-slate-200 text-slate-700 dark:bg-[#181818] dark:border-[#272727] dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#313131]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <span className="text-xs">{roleName}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono [font-variant-numeric:tabular-nums]">
                      {enabledCount} active
                    </Badge>
                  </button>
                );
              })}
            </div>

            {/* Right Categorized Breakdown */}
            <div className="md:col-span-8">
              <Card className="border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
                <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-[#272727] flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                      Effective Entitlements: {selectedRole}
                    </CardTitle>
                    <p className="text-[11px] text-slate-500 font-medium">Verified by Caldicott Information Governance Engine</p>
                  </div>
                  <Badge variant="info" className="text-[10px]">
                    Live RBAC Tier
                  </Badge>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {categories.map((cat) => (
                    <div key={cat.name} className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {cat.name}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {cat.permissions.map((permKey) => {
                          const isAllowed = Boolean(activeRolePermissions[permKey]);
                          return (
                            <div
                              key={permKey}
                              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                                isAllowed
                                  ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-slate-900 dark:text-slate-100'
                                  : 'bg-[#FAFAFA] border-slate-200 dark:bg-[#121212] dark:border-[#272727] text-slate-400'
                              }`}
                            >
                              <span className="font-medium capitalize">{permKey.replace(/([A-Z])/g, ' $1')}</span>
                              {isAllowed ? (
                                <Badge variant="success" className="text-[9px] font-mono">
                                  Allowed
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] font-mono text-slate-400 border-slate-200 dark:border-[#272727]">
                                  Denied
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
