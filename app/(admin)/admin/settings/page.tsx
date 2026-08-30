'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Hospital, Bell, Save, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [trustName, setTrustName] = useState('Oxford University Hospitals NHS Foundation Trust');
  const [hospitalPrefix, setHospitalPrefix] = useState('RALP-');
  const [notifyApiKey, setNotifyApiKey] = useState('••••••••••••••••••••••••••••••••');
  const [autoDispatchProms, setAutoDispatchProms] = useState(true);
  const [leadSurgeonCode, setLeadSurgeonCode] = useState('VK');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'System Settings Saved',
      description: 'Trust parameters and automated PROM dispatch rules updated.',
      variant: 'default',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trust & Registry System Settings"
        description="Configure hospital identification, NHS Notify integration, automated follow-up dispatch, and clinical defaults"
        breadcrumbs={[
          { label: 'Admin Console', href: '/admin' },
          { label: 'System Settings' },
        ]}
        action={
          <Button onClick={handleSave} size="sm" className="gap-1.5 shadow-sm">
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </Button>
        }
      />

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trust Profile */}
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="p-5 pb-3 border-b">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Hospital className="h-4 w-4 text-blue-600" />
              <span>NHS Trust & Centre Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">NHS Trust Name</label>
              <Input
                value={trustName}
                onChange={(e) => setTrustName(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hospital Medical Record Number (MRN) Prefix</label>
              <Input
                value={hospitalPrefix}
                onChange={(e) => setHospitalPrefix(e.target.value)}
                className="mt-1 text-xs font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Auto-assigned to new registered RALP patients (e.g. {hospitalPrefix}78205)
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Lead Registry Consultant</label>
              <Input
                value={leadSurgeonCode}
                onChange={(e) => setLeadSurgeonCode(e.target.value)}
                className="mt-1 text-xs font-mono"
              />
            </div>
          </CardContent>
        </Card>

        {/* Digital PROM Dispatch Settings */}
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="p-5 pb-3 border-b">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" />
              <span>NHS Notify & PROMs Automation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">NHS Notify API Key (Encrypted)</label>
              <Input
                type="password"
                value={notifyApiKey}
                onChange={(e) => setNotifyApiKey(e.target.value)}
                className="mt-1 text-xs font-mono"
              />
              <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                <CheckCircle2 className="h-3 w-3" />
                <span>Connected to NHS Notify Gateway</span>
              </span>
            </div>

            <div className="pt-2 border-t">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDispatchProms}
                  onChange={(e) => setAutoDispatchProms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                    Automated 14-Day Advance PROM Questionnaire Dispatch
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Automatically sends secure SMS/Email notification link to patient 14 days before 2m, 6m, 12m, 18m, 24m milestones.
                  </span>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
