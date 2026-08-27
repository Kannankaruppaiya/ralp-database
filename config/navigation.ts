export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string;
  description?: string;
  children?: NavItem[];
}

export const CLINICIAN_NAVIGATION: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Patients Registry',
    href: '/patients',
    icon: 'Users',
    children: [
      { title: 'All Patients', href: '/patients' },
      { title: 'Register New Patient', href: '/patients/new' },
    ],
  },
  {
    title: 'Follow-ups Management',
    href: '/follow-ups',
    icon: 'CalendarClock',
    children: [
      { title: 'All Follow-ups', href: '/follow-ups' },
      { title: 'Due Soon (30d)', href: '/follow-ups/due' },
      { title: 'Overdue Alerts', href: '/follow-ups/overdue' },
      { title: 'Completed Milestones', href: '/follow-ups/completed' },
    ],
  },
  {
    title: 'Data Ingestion & OCR',
    href: '/data-ingestion',
    icon: 'FileUp',
    children: [
      { title: 'Ingestion Overview', href: '/data-ingestion' },
      { title: 'Upload Documents', href: '/data-ingestion/upload' },
      { title: 'Extraction Review', href: '/data-ingestion/extraction-review' },
      { title: 'Patient Matching', href: '/data-ingestion/patient-matching' },
      { title: 'Conflict Resolution', href: '/data-ingestion/conflicts' },
    ],
  },
  {
    title: 'Review Queue',
    href: '/review-queue',
    icon: 'ClipboardCheck',
    badge: '3',
  },
  {
    title: 'Reports & Letters',
    href: '/reports',
    icon: 'FileText',
    children: [
      { title: 'Reports Hub', href: '/reports' },
      { title: 'Clinic Summary (MDT)', href: '/reports/clinic-summary' },
      { title: 'Printable Letter Formats', href: '/reports/print' },
    ],
  },
  {
    title: 'Analytics & Outcomes',
    href: '/analytics',
    icon: 'BarChart3',
    children: [
      { title: 'Outcomes & Trifecta', href: '/analytics/outcomes' },
      { title: 'Surgeon Benchmarking', href: '/analytics/surgeons' },
    ],
  },
];

export const PATIENT_NAVIGATION: NavItem[] = [
  {
    title: 'My Recovery Home',
    href: '/home',
    icon: 'Home',
  },
  {
    title: 'Outcome Assessments',
    href: '/assessment',
    icon: 'ClipboardList',
  },
  {
    title: 'My Follow-up Timeline',
    href: '/follow-up',
    icon: 'Calendar',
  },
];
