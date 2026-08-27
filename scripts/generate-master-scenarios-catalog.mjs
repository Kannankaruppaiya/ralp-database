import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================================');
console.log('🧠 SMART COMBINATORIAL SCENARIO GENERATOR — RALP DATABASE V2');
console.log('================================================================================\n');

const scenarios = [];
const uniqueSignatures = new Set();

function addScenario(scenario) {
  // Generate a distinct signature to guarantee zero duplicates
  const signature = `${scenario.module}|${scenario.category}|${scenario.surgeonOrRole}|${scenario.preConditions}|${scenario.action}|${scenario.expectedOutcome}`.toLowerCase();
  
  if (uniqueSignatures.has(signature)) {
    return false; // Skip duplicate
  }
  
  uniqueSignatures.add(signature);
  const id = `SCN-${String(scenarios.length + 1).padStart(4, '0')}`;
  scenarios.push({ id, ...scenario });
  return true;
}

// -----------------------------------------------------------------------------
// 1. CLINICAL & ONCOLOGICAL TRAJECTORY MATRIX (~800 Unique Scenarios)
// -----------------------------------------------------------------------------
const surgeons = ['VK', 'RDM', 'CI', 'OAK'];
const gradeGroups = [
  { gg: 1, gleason: '3+3=6', risk: 'Low Risk' },
  { gg: 2, gleason: '3+4=7a', risk: 'Favourable Intermediate Risk' },
  { gg: 3, gleason: '4+3=7b', risk: 'Unfavourable Intermediate Risk' },
  { gg: 4, gleason: '4+4=8', risk: 'High Risk' },
  { gg: 5, gleason: '4+5=9', risk: 'Very High Risk' },
];
const stages = [
  { stage: 'pT2a', desc: 'Organ-confined, <=50% of one lobe' },
  { stage: 'pT2b', desc: 'Organ-confined, >50% of one lobe' },
  { stage: 'pT2c', desc: 'Organ-confined, bilateral involvement' },
  { stage: 'pT3a', desc: 'Extraprostatic extension (EPE)' },
  { stage: 'pT3b', desc: 'Seminal vesicle invasion (SVI)' },
];
const margins = [
  { status: 'R0 Negative', desc: 'Clear surgical margins (>1mm margin clearance)' },
  { status: 'R1 Positive (Apical)', desc: 'Focal apical margin positive <=1mm' },
  { status: 'R1 Positive (Posterolateral)', desc: 'Posterolateral nerve-bundle margin positive' },
  { status: 'R1 Positive (Bladder Neck)', desc: 'Extensive bladder neck margin positivity' },
];
const nerveSparingOptions = [
  { ns: 'Bilateral Intrafascial (5/5)', potencyChance: 'High (80-90%)', edRisk: 'Minimal' },
  { ns: 'Unilateral Interfascial (3/5)', potencyChance: 'Moderate (45-60%)', edRisk: 'Mild/Moderate' },
  { ns: 'Non-Nerve Sparing (Wide Excision)', potencyChance: 'Low (<15%)', edRisk: 'Severe' },
  { ns: 'Partial Left / Sparing Right', potencyChance: 'Moderate (50%)', edRisk: 'Moderate' },
];

surgeons.forEach((surgeon) => {
  gradeGroups.forEach((gg) => {
    stages.forEach((st) => {
      margins.forEach((mg) => {
        nerveSparingOptions.forEach((ns) => {
          const isHighRisk = gg.gg >= 4 || st.stage.startsWith('pT3') || mg.status.includes('Positive');
          const psaOutcome = isHighRisk 
            ? 'PSA 12M >=0.20 ng/mL (Biochemical Recurrence triggered -> MDT Salvage Radiotherapy review)' 
            : 'PSA 12M <0.01 ng/mL (Undetectable PSA -> Ongoing longitudinal surveillance)';
          const priority = isHighRisk ? 'High' : 'Medium';

          addScenario({
            module: '1. Clinical & Oncological Pathways',
            category: isHighRisk ? 'High-Risk Oncological Surveillance' : 'Standard Curative Pathway',
            subCategory: `Gleason ${gg.gleason} • ${st.stage} • ${mg.status}`,
            surgeonOrRole: surgeon,
            preConditions: `Baseline Grade Group ${gg.gg} (${gg.gleason}), Clinical Stage ${st.stage}, Pre-op PSA 4.5-18.0 ng/mL`,
            action: `Surgeon ${surgeon} performs RALP with ${ns.ns} nerve sparing and histology confirms ${st.stage}, ${mg.status}`,
            expectedOutcome: `${psaOutcome}; Potency recovery profile: ${ns.potencyChance}; BAUS Registry oncological index recorded.`,
            complianceStandard: 'BAUS Radical Prostatectomy Registry & NPCA Oncological Standards',
            priority,
          });
        });
      });
    });
  });
});

// -----------------------------------------------------------------------------
// 2. DIGITAL PATIENT PORTAL & PROMS MATRIX (~224 Unique Scenarios)
// -----------------------------------------------------------------------------
const milestones = ['6w', '2m', '6m', '12m', '18m', '24m', '36m'];
const ipssTiers = [
  { tier: 'Mild (Score 0-7)', bother: 'Delighted/Pleased (0-1)', continence: 'Dry (0 pads/day)' },
  { tier: 'Moderate (Score 8-19)', bother: 'Mixed/Mostly Dissatisfied (3-4)', continence: '1 Security Pad/day' },
  { tier: 'Severe (Score 20-35)', bother: 'Unhappy/Terrible (5-6)', continence: '2-3 Pads/day (Moderate Incontinence)' },
  { tier: 'Refractory Incontinence', bother: 'Terrible (6)', continence: '>3 Pads/day (Severe Incontinence)' },
];
const shimTiers = [
  { tier: 'No ED (Score 22-25)', rehab: 'Spontaneous erections sufficient for intercourse' },
  { tier: 'Mild ED (Score 17-21)', rehab: 'Low-dose PDE5i on-demand' },
  { tier: 'Moderate ED (Score 12-16)', rehab: 'Daily Tadalafil 5mg + Vacuum Erection Device' },
  { tier: 'Severe ED (Score 1-7)', rehab: 'Intracavernosal Alprostadil Injections / Andrology Referral' },
];

milestones.forEach((milestone) => {
  ipssTiers.forEach((ipss) => {
    shimTiers.forEach((shim) => {
      ['Patient Magic Link SMS', 'NHS App Integration'].forEach((authMethod) => {
        addScenario({
          module: '2. Digital Patient Portal & PROMs',
          category: `Longitudinal Functional PROM Assessment (${milestone.toUpperCase()})`,
          subCategory: `IPSS: ${ipss.tier} | SHIM: ${shim.tier}`,
          surgeonOrRole: 'Patient / Specialist Nurse',
          preConditions: `Patient receives NHS Notify invitation via ${authMethod} for ${milestone.toUpperCase()} follow-up window`,
          action: `Patient authenticates via magic token and submits IPSS questionnaire (${ipss.tier}), Continence (${ipss.continence}), and SHIM (${shim.tier})`,
          expectedOutcome: `Instant score derivation; IPSS Bother: ${ipss.bother}; Rehab pathway triggered: ${shim.rehab}; Syncs directly with clinician timeline.`,
          complianceStandard: 'ICHOM Localized Prostate Cancer Standard Set & NHS PROMs Guidelines',
          priority: ipss.tier.includes('Severe') ? 'High' : 'Medium',
        });
      });
    });
  });
});

// -----------------------------------------------------------------------------
// 3. AI OCR INGESTION & CALDICOTT CONFLICT RESOLUTION (~120 Unique Scenarios)
// -----------------------------------------------------------------------------
const docTypes = [
  'NHS Electronic Discharge Summary (PDF)',
  'Histopathology Diagnostic Lab Slip (Scanned JPG)',
  'Multi-Page MDT Biopsy Report (PDF)',
  'External Hospital Transfer Summary (TIFF)',
  'Surgical Theatre Operation Record (PDF)',
  'GP Laboratory Biochemistry Results (Image)',
];
const conflictTypes = [
  { field: 'Pre-op PSA', discrepancy: 'OCR extracted PSA 14.2 ng/mL vs EHR record 4.2 ng/mL (Decimal OCR shift)', risk: 'High' },
  { field: 'Gleason Grade', discrepancy: 'OCR extracted 4+3 (GG3) vs Pathology slip 3+4 (GG2) (Pattern switch)', risk: 'Critical' },
  { field: 'Pathological Stage', discrepancy: 'OCR extracted pT3a (EPE) vs Operation note pT2c (Organ-confined)', risk: 'High' },
  { field: 'Margin Status', discrepancy: 'OCR extracted R1 Positive vs Discharge note R0 Negative', risk: 'Critical' },
];
const resolutionActions = [
  { action: 'Clinician accepts Source A (OCR AI Extraction)', outcome: 'Audit log records automated extraction approval with Caldicott Principle 7 timestamp' },
  { action: 'Clinician accepts Source B (Original EHR Record)', outcome: 'Audit log flags OCR discrepancy as rejected; original clinical value preserved' },
  { action: 'Clinician enters manual verified override value', outcome: 'Custom clinical override logged with consultant GMC number and rationale' },
  { action: 'Clinician marks document as Unresolved / Requests Rescan', outcome: 'Document shifted to Ingestion Review Queue with urgent lab re-test flag' },
  { action: 'Clinician rejects document as duplicate / corrupt', outcome: 'Document purged from staging with tamper-evident audit receipt' },
];

docTypes.forEach((doc) => {
  conflictTypes.forEach((conflict) => {
    resolutionActions.forEach((res) => {
      addScenario({
        module: '3. AI OCR Ingestion & Caldicott Conflicts',
        category: 'AI Document Parsing & Discrepancy Reconciliation',
        subCategory: `${conflict.field} Conflict Resolution`,
        surgeonOrRole: 'Consultant Surgeon / Caldicott Guardian',
        preConditions: `Document "${doc}" uploaded to Ingestion Pipeline; OCR identifies ${conflict.discrepancy}`,
        action: `Reviewer navigates to /data-ingestion/conflicts, views side-by-side comparison, and executes: ${res.action}`,
        expectedOutcome: `${res.outcome}; Reconciled payload ingested into patient record; Audit trail entry created.`,
        complianceStandard: 'Caldicott Principle 7 (Duty to Share & Verify) & DCB0129 Clinical Safety',
        priority: conflict.risk,
      });
    });
  });
});

// -----------------------------------------------------------------------------
// 4. UI DATA TABLES, SEARCH & FILTER PERMUTATIONS (~180 Unique Scenarios)
// -----------------------------------------------------------------------------
const tableViews = ['/patients', '/follow-ups/overdue', '/follow-ups/due', '/admin/data-quality'];
const searchQueries = [
  { query: 'Smith (Surname partial match)', target: 'Filters matching surname regardless of case' },
  { query: '467 569 1871 (10-digit NHS Number with spaces)', target: 'Normalizes and matches exact NHS Number' },
  { query: 'RALP-10042 (Hospital MRN)', target: 'Locates exact hospital identifier' },
  { query: 'A (1-character query)', target: 'Shows hint: type at least 2 characters to search' },
];
const pageSizes = [15, 25, 50, 100];
const sortColumns = ['Patient Name', 'Due Date', 'Surgeon', 'PSA Status', 'Completeness Score'];

surgeons.forEach((surgeon) => {
  stages.slice(0, 3).forEach((st) => {
    ['OVERDUE', 'DUE', 'COMPLETED'].forEach((status) => {
      pageSizes.slice(0, 3).forEach((size) => {
        addScenario({
          module: '4. UI Data Tables, Search & Filter Permutations',
          category: 'Interactive Data Table & Slicing Controls',
          subCategory: `Surgeon: ${surgeon} • Stage: ${st.stage} • Status: ${status}`,
          surgeonOrRole: 'Clinician / System User',
          preConditions: `10,000 Patient Cohort active in in-memory master cache; Table page size set to ${size} / page`,
          action: `User selects Surgeon filter "${surgeon}", Stage filter "${st.stage}", Follow-up status "${status}", and sorts by Due Date ASC`,
          expectedOutcome: `Instant zero-lag filtering (<5ms); Sticky header remains anchored; Pagination footer reflects exact subset (Showing 1 to ${size} of N); Zero page scroll overshoot.`,
          complianceStandard: 'Enterprise Web Accessibility (WCAG 2.2 AA) & NHS Design System',
          priority: 'Medium',
        });
      });
    });
  });
});

// Add specific Search & Sorting scenarios
searchQueries.forEach((sq) => {
  sortColumns.forEach((col) => {
    addScenario({
      module: '4. UI Data Tables, Search & Filter Permutations',
      category: 'Search & Column Sort Combination',
      subCategory: `Query: ${sq.query} • Sort: ${col}`,
      surgeonOrRole: 'Clinician User',
      preConditions: `Patients registry open with 10,000 records`,
      action: `User enters "${sq.query}" in search input and clicks column header "${col}" to toggle DESC`,
      expectedOutcome: `${sq.target}; Table immediately rearranges rows by ${col} in descending order; Pagination resets safely to Page 1.`,
      complianceStandard: 'NHS Digital Usability & Accessibility Standards',
      priority: 'Low',
    });
  });
});

// -----------------------------------------------------------------------------
// 5. SECURITY, RBAC, CALDICOTT AUDIT LOGS & GOVERNANCE (~140 Unique Scenarios)
// -----------------------------------------------------------------------------
const roles = [
  { role: 'Consultant Surgeon', accessLevel: 'Full Clinical & Surgical Record Editing' },
  { role: 'Registrar / Fellow', accessLevel: 'Clinical Data Entry with Senior Oversight' },
  { role: 'Urology Specialist Nurse', accessLevel: 'PROM Dispatch, Triage Queue & Patient Notes' },
  { role: 'Caldicott Guardian', accessLevel: 'Audit Trail Inspection & Information Governance Override' },
  { role: 'System Administrator', accessLevel: 'User Management, System Config & Synthetic Injection' },
];
const securityActions = [
  { action: 'View Identified Patient Record', permittedRoles: ['Consultant Surgeon', 'Registrar / Fellow', 'Urology Specialist Nurse', 'Caldicott Guardian'] },
  { action: 'Log RALP Intra-operative Record', permittedRoles: ['Consultant Surgeon', 'Registrar / Fellow'] },
  { action: 'Edit Post-op Histopathology Report', permittedRoles: ['Consultant Surgeon', 'Registrar / Fellow'] },
  { action: 'Dispatch Digital PROM Questionnaires via NHS Notify', permittedRoles: ['Consultant Surgeon', 'Urology Specialist Nurse', 'System Administrator'] },
  { action: 'Override OCR AI Discrepancy Conflict', permittedRoles: ['Consultant Surgeon', 'Caldicott Guardian'] },
  { action: 'Export Caldicott Security Audit Log to CSV', permittedRoles: ['Caldicott Guardian', 'System Administrator'] },
  { action: 'Inject 10,000 Live Patient Synthetic Cohort', permittedRoles: ['System Administrator'] },
  { action: 'Modify BAUS / NPCA Registry Thresholds', permittedRoles: ['System Administrator'] },
  { action: 'Generate MDT Biochemical Recurrence Referral Letter', permittedRoles: ['Consultant Surgeon', 'Registrar / Fellow', 'Urology Specialist Nurse'] },
  { action: 'Purge / Invalidate Local Storage Data Cache', permittedRoles: ['System Administrator', 'Consultant Surgeon'] },
  { action: 'View De-identified Pentafecta Analytics Benchmark', permittedRoles: ['Consultant Surgeon', 'Registrar / Fellow', 'Urology Specialist Nurse', 'Caldicott Guardian', 'System Administrator'] },
  { action: 'Access System Role Configuration Page', permittedRoles: ['System Administrator'] },
  { action: 'Attempt Unauthorized Cross-Role Record Deletion', permittedRoles: [] },
  { action: 'Record Caldicott Emergency Access Override (Break-Glass)', permittedRoles: ['Consultant Surgeon', 'Caldicott Guardian'] },
];

roles.forEach((r) => {
  securityActions.forEach((sa) => {
    const isPermitted = sa.permittedRoles.includes(r.role);
    addScenario({
      module: '5. Security, RBAC & Caldicott Audit Logs',
      category: isPermitted ? 'Authorized RBAC Execution' : 'Security Boundary Enforcement',
      subCategory: `${r.role} -> ${sa.action}`,
      surgeonOrRole: r.role,
      preConditions: `User logged in with verified session token as "${r.role}"`,
      action: `User attempts to execute action: "${sa.action}"`,
      expectedOutcome: isPermitted 
        ? `Action permitted; Operation executes successfully; Caldicott immutable audit log writes 256-bit tamper receipt.`
        : `Action denied (HTTP 403 Forbidden); Access alert raised; Security audit trail records unauthorized access attempt.`,
      complianceStandard: 'NHS Data Security and Protection Toolkit (DSPT) & Caldicott Principles 1-8',
      priority: isPermitted ? 'Medium' : 'Critical',
    });
  });
});

// -----------------------------------------------------------------------------
// 6. ANALYTICS, PENTAFECTA & REGISTRY STATUTORY EXPORTS (~48 Unique Scenarios)
// -----------------------------------------------------------------------------
const riskBands = ['D\'Amico Low Risk', 'Favourable Intermediate Risk', 'Unfavourable Intermediate Risk', 'High Risk / Locally Advanced'];
const outcomeMetrics = [
  { metric: 'Trifecta Rate (Continence + Potency + PSA <0.2)', target: 'Calculates 12M/24M composite success benchmark' },
  { metric: 'Pentafecta Rate (Trifecta + R0 Margin + No Clavien Complications)', target: 'Calculates pristine surgical mastery index' },
  { metric: 'Kaplan-Meier BCR-Free Survival Curve', target: 'Generates 36-month biochemical recurrence-free survival probability' },
  { metric: 'Continence Recovery Longitudinal Velocity', target: 'Plots 0-pad recovery percentage from 6w through 36m' },
];

surgeons.forEach((surgeon) => {
  riskBands.forEach((risk) => {
    outcomeMetrics.forEach((om) => {
      addScenario({
        module: '6. Analytics, Pentafecta & Registry Exports',
        category: 'Longitudinal Surgical Quality Benchmark',
        subCategory: `Surgeon ${surgeon} • ${risk} • ${om.metric}`,
        surgeonOrRole: surgeon,
        preConditions: `10,000 cohort aggregated in memory; Surgeon ${surgeon} filter applied with ${risk} cohort`,
        action: `Analytics engine calculates ${om.metric} for Surgeon ${surgeon} across 36-month timeline`,
        expectedOutcome: `${om.target}; Validates against National Prostate Cancer Audit (NPCA) 95% confidence intervals; Renders interactive Chart.js visualization.`,
        complianceStandard: 'NPCA Annual Performance Indicators & BAUS Quality Assurance Matrix',
        priority: 'High',
      });
    });
  });
});

console.log(`✅ Generated ${scenarios.length.toLocaleString()} 100% UNIQUE, NON-DUPLICATE SCENARIOS!`);
console.log(`🔒 Deduplication check: Set size = ${uniqueSignatures.size}, List size = ${scenarios.length} (Delta = ${scenarios.length - uniqueSignatures.size})\n`);

// -----------------------------------------------------------------------------
// EXPORT TO EXCEL COMPLIANT CSV (WITH UTF-8 BOM)
// -----------------------------------------------------------------------------
const csvHeader = [
  'Scenario ID',
  'Module / Pillar',
  'Scenario Category',
  'Sub-Category / Clinical Phenotype',
  'Surgeon / Actor Role',
  'Pre-Conditions & Clinical Parameters',
  'Execution Action / Trigger',
  'Expected Clinical & System Outcome',
  'Compliance & Clinical Standard',
  'Priority / Risk Level'
];

function escapeCsv(str) {
  if (str === undefined || str === null) return '""';
  const escaped = String(str).replace(/"/g, '""');
  return `"${escaped}"`;
}

const csvRows = scenarios.map((s) => [
  escapeCsv(s.id),
  escapeCsv(s.module),
  escapeCsv(s.category),
  escapeCsv(s.subCategory),
  escapeCsv(s.surgeonOrRole),
  escapeCsv(s.preConditions),
  escapeCsv(s.action),
  escapeCsv(s.expectedOutcome),
  escapeCsv(s.complianceStandard),
  escapeCsv(s.priority),
].join(','));

// UTF-8 BOM (\uFEFF) ensures Excel opens special characters and formatting without any mojibake
const csvContent = '\uFEFF' + [csvHeader.join(','), ...csvRows].join('\n');

const docsDir = path.join(__dirname, '../docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const csvFilePath = path.join(docsDir, 'RALP_MASTER_1500_SCENARIOS_CATALOG.csv');
fs.writeFileSync(csvFilePath, csvContent, 'utf-8');

console.log(`📁 Exported Excel CSV: ${csvFilePath} (${(csvContent.length / 1024).toFixed(1)} KB)`);

// -----------------------------------------------------------------------------
// EXPORT SUMMARY MARKDOWN REPORT FOR CLIENT
// -----------------------------------------------------------------------------
const moduleBreakdown = scenarios.reduce((acc, s) => {
  acc[s.module] = (acc[s.module] || 0) + 1;
  return acc;
}, {});

const mdReport = `# 📋 RALP Database v2 — Master Catalog of 1,500+ Scenarios
**Generated**: ${new Date().toISOString().split('T')[0]} | **Total Unique Scenarios**: **${scenarios.length.toLocaleString()}** | **Duplicates**: **0**

---

## 📊 Executive Summary Matrix

| # | Core Platform Pillar / Module | Unique Scenario Count | Primary Clinical / Functional Scope |
| :---: | :--- | :---: | :--- |
| **1** | **Clinical & Oncological Pathways** | **${moduleBreakdown['1. Clinical & Oncological Pathways']}** | Multi-Surgeon $\\times$ Gleason $\\times$ Stage $\\times$ Margins $\\times$ Nerve Sparing combinations |
| **2** | **Digital Patient Portal & PROMs** | **${moduleBreakdown['2. Digital Patient Portal & PROMs']}** | 7 Milestones $\\times$ IPSS $\\times$ SHIM $\\times$ Continence Pads $\\times$ Auth Channels |
| **3** | **AI OCR Ingestion & Caldicott Conflicts** | **${moduleBreakdown['3. AI OCR Ingestion & Caldicott Conflicts']}** | 6 Document Types $\\times$ 4 Discrepancies $\\times$ 5 Resolution Override Actions |
| **4** | **UI Data Tables, Search & Filter Permutations** | **${moduleBreakdown['4. UI Data Tables, Search & Filter Permutations']}** | Filter combinations $\\times$ Multi-surgeon $\\times$ Status $\\times$ Sorting & Search queries |
| **5** | **Security, RBAC & Caldicott Audit Logs** | **${moduleBreakdown['5. Security, RBAC & Caldicott Audit Logs']}** | 5 Roles $\\times$ 14 Actions $\\times$ Authorized/Denied boundary enforcement |
| **6** | **Analytics, Pentafecta & Registry Exports** | **${moduleBreakdown['6. Analytics, Pentafecta & Registry Exports']}** | 4 Surgeons $\\times$ 4 Risk Bands $\\times$ Trifecta, Pentafecta & Kaplan-Meier curves |
| **Total** | **All Modules Combined** | **${scenarios.length.toLocaleString()} Scenarios** | **100% Zero-Duplicate Master Verification Matrix** |

---

## 📥 Excel File Location
The full multi-column spreadsheet is saved at:
- **CSV / Excel Spreadsheet**: \`docs/RALP_MASTER_1500_SCENARIOS_CATALOG.csv\`

You can open this file directly in **Microsoft Excel, Apple Numbers, or Google Sheets**.
`;

const mdFilePath = path.join(docsDir, 'RALP_MASTER_1500_SCENARIOS_REPORT.md');
fs.writeFileSync(mdFilePath, mdReport, 'utf-8');

console.log(`📄 Exported Client Markdown Report: ${mdFilePath}`);
console.log('\n================================================================================');
console.log('🎉 1,500+ SCENARIOS GENERATED & CATALOGED SUCCESSFULLY!');
console.log('================================================================================\n');
