# Architecture Overview
This document serves as a critical, living template designed to equip developers, architects, and agents with a rapid and comprehensive understanding of the codebase's architecture, enabling efficient navigation and effective contribution from day one. Update this document as the codebase evolves.

---

## 1. Project Structure
This section provides a high-level overview of the project's directory and file structure, categorized by architectural layer and functional modules.

```
[Project Root]/
├── app/                          # Next.js 15 App Router (Pages, Routes, Layouts)
│   ├── (admin)/                  # Standalone Data Governance & Administration Portal
│   │   └── admin/                # /admin routes (users, roles, audit-log, data-quality, exports, settings)
│   ├── (auth)/                   # Authentication Pages (login, admin-login, forgot-password, verify)
│   ├── (clinician)/              # Clinician Command Center & Surgical Registry
│   │   ├── dashboard/            # Clinical triage hub, KPIs, overdue follow-up queues
│   │   ├── patients/             # Master patient registry, new patient creation, dossiers (/patients/[patientId]/*)
│   │   ├── data-ingestion/       # Upload, OCR extraction review, patient matching, conflict resolution
│   │   ├── follow-ups/           # Longitudinal follow-up tracker (Due, Overdue, Completed)
│   │   ├── analytics/            # Pentafecta & Trifecta oncology/functional outcome analytics
│   │   └── reports/              # Clinical summary generation & printable theatre dossiers
│   ├── (patient)/                # Patient Self-Reported Outcome Measures (PROMs) Portal
│   │   ├── home/                 # Patient recovery timeline and pending questionnaires
│   │   └── assessment/           # Multi-step validated PROMs (/ipss, /shim, /incontinence, /review)
│   ├── api/                      # Next.js Server Route Handlers
│   │   ├── account/              # User profile & credentials management
│   │   ├── admin/                # User provisioning, Caldicott exports, audit endpoints
│   │   ├── ingestion/            # Mammoth.js DOCX parser & AI OCR endpoints
│   │   └── patients/             # Patient data mutations and derived metrics APIs
│   ├── layout.tsx                # Root layout, theme providers, font definitions
│   ├── loading.tsx               # Global loading states
│   ├── not-found.tsx             # 404 error boundaries
│   └── globals.css               # Tailwind CSS design system & custom tokens
├── components/                   # Reusable UI & Domain Components
│   ├── ui/                       # Atomic shadcn/ui components (buttons, dialogs, tables, tabs, badges)
│   ├── layout/                   # Navigation headers, clinician/patient/admin sidebars, command menus
│   ├── patients/                 # Patient-specific cards, timeline visualizers, staging badges
│   └── charts/                   # Recharts wrappers (PSA velocity curves, Pentafecta radar charts)
├── features/                     # Feature-Driven Business Logic & Workflows
│   ├── auth/                     # Authentication hooks, session stores, RBAC definitions
│   ├── patients/                 # Patient dossier state machines, search indices, mutation hooks
│   └── data-ingestion/           # OCR parser utilities, diff engines, fuzzy matching algorithms
├── hooks/                        # Custom React Hooks (debounced search, permissions, cache readers)
├── lib/                          # Core Utilities, Client Libraries & Performance Layer
│   ├── supabase/                 # Supabase SSR client, server client, middleware helpers
│   ├── api/                      # Standardized fetch handlers, error interceptors
│   ├── cache.ts                  # In-memory LRU/TTL caching layer (ADR-001)
│   ├── audit.ts                  # Caldicott Principle 7 immutable audit logger (ADR-002)
│   ├── date.ts                   # UK NHS date formatting (DD/MM/YYYY) and milestone calculators
│   └── validation.ts             # Zod schema validators for clinical models & PROMs
├── types/                        # Shared TypeScript Definitions (One-to-one mapping with Postgres Schema)
│   ├── patient.ts                # Patient demographics, status, staging, risk tiering
│   ├── histology.ts              # Pathological stage, Gleason grade, margin status (R0/R1)
│   ├── prom.ts                   # IPSS, SHIM / IIEF-5, Continence pad tracking models
│   ├── document.ts               # Ingested files, OCR confidence, conflict queue models
│   ├── auth.ts                   # User roles, permission matrices, profile records
│   └── database.ts               # Supabase auto-generated database type contracts
├── supabase/                     # Database Engine, Schema & Migrations
│   ├── migrations/               # Versioned SQL migrations (0001_schema to 0009_account_lifecycle)
│   ├── seed.sql                  # Base database seed definitions
│   └── config.toml               # Local Supabase environment configurations
├── docs/                         # Architecture, Specifications, Decisions & Runbooks
│   ├── decisions/                # Architecture Decision Records (ADR-001, ADR-002, ADR-003)
│   ├── architecture/             # Archify interactive diagrams (.html & .json models)
│   ├── CLIENT_SPECIFICATION.md   # Comprehensive clinical module breakdown & workflows
│   └── ENVIRONMENTS.md           # Multi-tier cloud configuration guide (Dev, Staging, Prod)
├── scripts/                      # Operational Scripts & Benchmarking
│   ├── seed-cohort.mjs           # Synthetic cohort generator (200-1500 realistic clinical records)
│   ├── db-push.mjs               # Zero-downtime database migration deployer
│   └── performance-test.mjs      # Autocannon load testing and latency validator
├── .env.development.example      # Development environment template
├── .env.staging.example          # Staging environment template
├── .env.production.example       # Production environment template
├── package.json                  # Dependencies, scripts, and build tasks
├── tsconfig.json                 # TypeScript strict compiler options
├── tailwind.config.ts            # Tailwind CSS styling and theme tokens
├── middleware.ts                 # Next.js edge route protection & session refresh
├── README.md                     # Project overview and quickstart guide
└── ARCHITECTURE.md               # This document
```

---

## 2. High-Level System Diagram

```
+---------------------------------------------------------------------------------------------------------+
|                                              CLIENT TIER                                                |
|                                                                                                         |
|   +-----------------------+     +-----------------------+     +-------------------------------------+   |
|   |   Clinician Browser   |     |    Patient Portal     |     |       Data Governance Admin         |   |
|   |  (Desktop / Tablet)   |     |    (Mobile / Web)     |     |             (Desktop)               |   |
|   +-----------+-----------+     +-----------+-----------+     +------------------+------------------+   |
+---------------|-----------------------------|------------------------------------|----------------------+
                |                             |                                    |
                | HTTPS (TLS 1.3)             | HTTPS (TLS 1.3)                    | HTTPS (TLS 1.3)
                v                             v                                    v
+---------------------------------------------------------------------------------------------------------+
|                                      APPLICATION & EDGE TIER (Next.js 15)                               |
|                                                                                                         |
|   +-------------------------------------------------------------------------------------------------+   |
|   | Next.js Auth Middleware (Edge Route Guard + Token Refresh + RBAC Verification)                  |   |
|   +-------------------------------------------------------------------------------------------------+   |
|                                                     |                                                   |
|       +---------------------------------------------+---------------------------------------------+     |
|       |                                             |                                             |     |
|       v                                             v                                             v     |
|   +-----------------------+     +-----------------------+     +-------------------------------------+   |
|   | React Server Comps    |     | API Route Handlers    |     | Document Ingestion Pipeline         |   |
|   | (SSR Data Hydration)  |     | (/api/account, admin) |     | (Mammoth.js DOCX + PDF NLP Parser)  |   |
|   +-----------+-----------+     +-----------+-----------+     +------------------+------------------+   |
|               |                             |                                    |                      |
|               +-----------------------------+------------------------------------+                      |
|                                             |                                                           |
|                                             v                                                           |
|                       +-------------------------------------------+                                     |
|                       | In-Memory Cache Layer (LRU / Sub-ms, ADR-001)                                    |   |
|                       +---------------------+---------------------+                                     |
+---------------------------------------------|-----------------------------------------------------------+
                                              |
                                              | Secure Supabase PostgREST & Storage Protocol
                                              v
+---------------------------------------------------------------------------------------------------------+
|                                    DATA & PERSISTENCE TIER (Supabase Cloud)                             |
|                                                                                                         |
|   +-------------------------------------------------------------------------------------------------+   |
|   | Supabase Auth Service (GoTrue: JWT Tokens, Session Management, Secure HttpOnly Cookies)         |   |
|   +-------------------------------------------------------------------------------------------------+   |
|                                                     |                                                   |
|   +-------------------------------------------------+-----------------------------------------------+   |
|   | PostgreSQL Database (v15+):                                                                     |   |
|   |   - Row Level Security (RLS) Policies (Role & Patient Data Isolation)                           |   |
|   |   - Computed Clinical Triggers (ISUP Grade Group, PSA >= 0.2 Recurrence Flags)                 |   |
|   |   - Append-Only Immutable Audit Trail (Caldicott Principle 7, ADR-002)                         |   |
|   +-------------------------------------------------+-----------------------------------------------+   |
|                                                     |                                                   |
|   +-------------------------------------------------+-----------------------------------------------+   |
|   | Supabase Object Storage (S3-Compatible Encrypted Bucket: Pathology PDFs, Theatre DOCX)          |   |
|   +-------------------------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------------------------+
```

---

## 3. Core Components

### 3.1. Frontend Applications (App Layer)

- **Name:** Next.js 15 Multi-Role Clinical Portal
- **Description:** A unified, responsive web application serving three distinct clinical and administrative user roles through route grouping:
  1. `(clinician)`: Patient registration, 4-tab surgical dossier, longitudinal PSA/follow-up trackers, document upload, and Trifecta/Pentafecta oncology analytics.
  2. `(patient)`: Digital, mobile-first assessment flow for validated PROMs (**IPSS**, **SHIM / IIEF-5**, **Continence pad count**) with automatic milestone completion.
  3. `(admin)`: Role-Based User Provisioning, Caldicott Principle 7 audit log viewer, NPCA data completeness inspector, and pseudonymized CSV export generator.
- **Technologies:** Next.js 15 (App Router, Server Components & Server Actions), React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Zod.
- **Deployment:** Vercel / Node.js Edge Runtime with multi-tier staging and production build pipelines.

---

### 3.2. Backend & Internal Processing Services

#### 3.2.1. Intelligent Document Ingestion & NLP Extraction Engine
- **Name:** Document Ingestion & Verification Subsystem
- **Description:** Processes unstructured theatre operative notes (.docx) and scanned pathology histology reports (.pdf). Extracts structured clinical parameters (Gleason grades, pathological stage, nerve-sparing grades, margin status $R0/R1$, extraprostatic extension $EPE$, seminal vesicle invasion $SVI$). Matches documents to patient records using deterministic fuzzy matching and routes ambiguous cases to an interactive **Review & Conflict Queue**.
- **Technologies:** Node.js, `mammoth` (DOCX extraction), RegEx/NLP parsing rules, Zod schemas.
- **Deployment:** Next.js Serverless Route Handlers (`/api/ingestion/*`).

#### 3.2.2. In-Memory Performance & Caching Layer (ADR-001)
- **Name:** Clinical Registry Memory Cache
- **Description:** A dedicated server-side in-memory caching engine that stores computed registry metrics, patient index listings, and surgeon caseload distributions. Delivers sub-millisecond response times ($<5\text{ms}$) for high-frequency clinician reads and automatically invalidates on patient record mutations.
- **Technologies:** TypeScript In-Memory LRU Cache with TTL invalidation.
- **Deployment:** Embedded in Next.js Server Process.

#### 3.2.3. Audit & Compliance Governance Engine (ADR-002)
- **Name:** Caldicott Principle 7 Audit Subsystem
- **Description:** An append-only audit trail capturing all clinical record views, mutations, AI extraction overrides, and national registry exports. Automatically extracts actor identity directly from verified Supabase session tokens via security-definer PostgreSQL functions to prevent identity spoofing. `UPDATE` and `DELETE` permissions are permanently revoked on the database level.
- **Technologies:** PostgreSQL Functions (`SECURITY DEFINER`), Supabase RLS, TypeScript audit logger.
- **Deployment:** Database-native PostgreSQL triggers and server-side middleware.

---

## 4. Data Stores

### 4.1. Primary Relational Database
- **Name:** Supabase PostgreSQL Database (One isolated project per tier: Development, Staging, Production)
- **Type:** PostgreSQL 15+ with `pg_trgm` extension for sub-millisecond text searching.
- **Purpose:** Central single-source-of-truth for all clinical records, surgical parameters, PROMs questionnaires, users, and audit events.
- **Key Schemas / Tables:**
  - `profiles`: User accounts, clinical roles (`Consultant Surgeon`, `Surgical Registrar`, `Clinical Nurse Specialist`, `Data Manager`, `Patient`), GMC numbers, and hospital affiliations.
  - `patients`: Master demographic registry with unique NHS Numbers (10 digits) and Hospital Numbers.
  - `baseline_assessments`: Pre-op PSA, diagnostic biopsy Gleason score, positive core %, Cambridge Prognostic Group (CPG), D'Amico risk classification.
  - `operations`: Primary surgeon code (`VK`, `RDM`, `CI`, `OAK`), bladder neck preservation, bilateral 5-point nerve sparing grades, sphincter reconstruction, blood loss, and operative duration.
  - `histology`: Pathological pT stage (`pT2a`-`pT3b`), pathological Gleason score, surgical margins ($R0/R1$), $EPE$, and $SVI$.
  - `prom_assessments`: Longitudinal patient-reported outcomes (IPSS score 0-35, SHIM score 1-25, 24h pad counts).
  - `follow_ups`: Automated 7-milestone longitudinal schedule (**6-week, 2, 6, 12, 18, 24, 36 Months**) with biochemical recurrence indicators ($\text{PSA} \ge 0.2\text{ ng/mL}$).
  - `documents`: Uploaded document metadata, extraction confidence scores, and OCR raw outputs.
  - `audit_log`: Immutable, append-only log of all system events with Caldicott Principle 7 metadata.
  - `ingestion_conflicts`: Discrepancy tracking queue with clinical override justifications.

### 4.2. File & Document Storage
- **Name:** Supabase Storage (`documents` bucket)
- **Type:** AWS S3-compatible encrypted object storage.
- **Purpose:** Secure storage of original uploaded operation notes (.docx) and pathology reports (.pdf).
- **Security:** Protected by Row Level Security; accessed strictly through time-limited signed URLs.

---

## 5. External Integrations / APIs

1. **Supabase Auth (GoTrue API)**:
   - *Purpose:* User identity, password encryption, JWT issuance, password resets, and session cookie validation.
   - *Integration:* `@supabase/ssr` and `@supabase/supabase-js`.
2. **Mammoth.js Document Engine**:
   - *Purpose:* Converts Microsoft Word (.docx) theatre operation notes into clean HTML/plain text for NLP extraction.
   - *Integration:* Node.js library module.
3. **National Prostate Cancer Audit (NPCA) & BAUS Export Interface**:
   - *Purpose:* Structured pseudonymized CSV export generator conforming to UK national urological registry reporting standards.
   - *Integration:* Internal streaming CSV exporter.

---

## 6. Deployment & Infrastructure

- **Cloud Provider:** Vercel (Frontend & Edge API) + Supabase Cloud (PostgreSQL, Storage, Auth).
- **Environment Tiers:**
  - *Development:* Dedicated local/cloud dev tier with synthetic patient cohort seeding (`npm run dev`).
  - *Staging:* Pre-production mirror with automated Vitest integration testing (`npm run dev:staging`).
  - *Production:* High-availability, hardened clinical database with PITR backups (`npm run build`).
- **CI / CD Pipeline:**
  - Automated Typecheck: `npm run typecheck` (`tsc --noEmit`)
  - Integration Tests: `npm run test` (Vitest unit and schema test suite)
  - Performance Benchmark: `npm run test:perf` (Autocannon latency/throughput validation)
  - Zero-Downtime Migration Deployment: `npm run db:push:dev` / `npm run db:push:prod`
- **Database Backups:** Automated daily backups and Point-In-Time Recovery (PITR) on production tier.

---

## 7. Security Considerations

- **Authentication:** Supabase Auth with JSON Web Tokens (JWT) stored in secure `HttpOnly`, `SameSite=Lax`, encrypted cookies. Automatic session refresh on every request via Next.js edge middleware.
- **Authorization & RBAC:**
  - Strict Role-Based Access Control enforced at both the Edge Middleware level and Database Row Level Security (RLS) level.
  - Patients are cryptographically restricted to accessing exclusively their own linked `prom_assessments` and recovery timeline.
  - The `/admin` routes and audit inspection functions require the `Data Manager` role.
- **Data Protection & Encryption:**
  - *In Transit:* Mandatory TLS 1.3 encryption across all client-server and database connections.
  - *At Rest:* PostgreSQL tables and Supabase Object Storage buckets encrypted with AES-256.
- **UK Healthcare Compliance (Caldicott Principle 7 & GDPR):**
  - Complete, immutable audit logging of all clinical file reads, mutations, and export downloads.
  - Automated pseudonymization (masking NHS Number, Hospital Number, Patient Name) for research exports.

---

## 8. Development & Testing Environment

### Quick Setup:
```bash
# 1. Install dependencies
npm install

# 2. Configure environment (copy example)
cp .env.development.example .env.development

# 3. Apply database migrations to development tier
npm run db:push:dev

# 4. Seed development database with synthetic patient cohort
node scripts/seed-cohort.mjs development 200

# 5. Start development server with Turbopack
npm run dev
```

### Testing & Quality Suite:
- **Unit & Integration Tests:** `npm run test` (Vitest)
- **Static Type Checking:** `npm run typecheck` (TypeScript)
- **Performance & Load Testing:** `npm run test:perf` and `npm run test:load1000`
- **Code Linter:** `npm run lint` (ESLint)

---

## 9. Future Considerations / Roadmap

1. **Direct NHS EPR / Epic Integration**: Transition from manual DOCX/PDF upload to direct HL7 / FHIR API integration for automated real-time patient syncing.
2. **AI Multimodal LLM Extraction**: Integrate localized, privacy-preserving medical LLM pipelines to improve complex handwritten pathology OCR accuracy.
3. **Automated Patient SMS/Email Reminders**: Integrate NHS Notify or Gov.uk Notify for automated follow-up PROM completion alerts.
4. **Predictive Recurrence Analytics**: Machine learning models predicting individual biochemical recurrence risk based on preoperative Gleason group and surgical margins.

---

## 10. Project Identification

- **Project Name:** UK RALP Surgical Outcomes Database v2
- **Repository URL:** `c:\Users\Kannan\Documents\Vivek` (Local Clinical Development Workspace)
- **Target Institution:** Oxford University Hospitals NHS Foundation Trust & Associated Urological Units
- **Primary Clinical Focus:** Robotic-Assisted Laparoscopic Prostatectomy (RALP) Registry & PROMs
- **Date of Last Update:** 2026-08-29

---

## 11. Glossary & Clinical Acronyms

| Acronym / Term | Full Definition & Clinical Explanation |
| :--- | :--- |
| **RALP** | **Robotic-Assisted Laparoscopic Prostatectomy** (Minimally invasive robotic surgical removal of the prostate gland). |
| **PROMs** | **Patient-Reported Outcome Measures** (Validated questionnaires completed by patients measuring functional health status). |
| **PSA** | **Prostate-Specific Antigen** (Blood test marker measured in $\text{ng/mL}$; post-RALP nadir should be undetectable $<0.1\text{ ng/mL}$). |
| **BCR** | **Biochemical Recurrence** (Post-operative cancer recurrence defined as a confirmed $\text{PSA} \ge 0.2\text{ ng/mL}$). |
| **IPSS** | **International Prostate Symptom Score** (Validated 8-question score measuring urinary symptoms from 0 to 35). |
| **SHIM / IIEF-5** | **Sexual Health Inventory for Men** (5-question survey measuring erectile function from 1 to 25). |
| **Trifecta** | Clinical triad of successful RALP: **Cancer Control** (Undetectable PSA) + **Continence** (0 pads) + **Potency** (Functional erection). |
| **Pentafecta** | **Trifecta** + **Negative Surgical Margins ($R0$)** + **No Perioperative Complications**. |
| **Gleason Score** | Pathological grading of prostate cancer tissue architectural patterns (e.g. $3+4=7$, Grade Group 2). |
| **pT Stage** | **Pathological Tumor Stage** ($pT2a-c$: Organ-confined; $pT3a$: Extraprostatic extension; $pT3b$: Seminal vesicle invasion). |
| **Caldicott Principle 7** | UK Information Governance standard: *"The duty to share information for individual care is as important as the duty to protect patient confidentiality."* |
| **RLS** | **Row Level Security** (PostgreSQL security mechanism restricting database row access based on user session context). |
