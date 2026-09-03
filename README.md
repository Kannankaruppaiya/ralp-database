# UK RALP Surgical Outcomes Database v2
> **Enterprise Clinical Data Registry & Patient-Reported Outcome Measures (PROMs) Platform for Robotic-Assisted Laparoscopic Prostatectomy**

---

## 🏥 Overview

The **UK RALP Surgical Outcomes Database v2** is a clinical registry, data ingestion pipeline, and longitudinal PROMs tracking platform purpose-built for Robotic-Assisted Laparoscopic Prostatectomy (RALP). It complies with British Association of Urological Surgeons (BAUS), National Prostate Cancer Audit (NPCA), and UK Information Governance (Caldicott Principle 7) standards.

---

## ✨ Key Features & Architecture

### 1. Clinician Command Center & Surgical Registry
- **Pre-Operative Cancer Profile**: PSA (ng/mL), Biopsy Gleason score (`3+3` to `5+4`), Grade Group (`1-5`), `% positive cores`, Cambridge Prognostic Group (CPG), and D'Amico Risk Stratification.
- **Theatre Operation Record**: Surgeon code (`VK`, `RDM`, `CI`, `OAK`), Nerve Sparing (`Bilateral 5/5`, `4/5`, `Partial`, `None`), Bladder Neck preservation, EBL (mL), and operating duration.
- **Post-Operative Histopathology**: Pathological stage (`pT2a` to `pT3b`), Gleason grade migration, Surgical Margins (`R0` vs `R1`), Extraprostatic Extension (`EPE`), and Seminal Vesicle Invasion (`SVI`).
- **Longitudinal 3-Year Follow-up Protocol**: 7 milestones at **6-week, 2, 6, 12, 18, 24, and 36 Months** with automated Biochemical Recurrence (`PSA >= 0.2 ng/mL`) alerts.
- **Surgeon Quality Benchmarking**: Unit-wide and surgeon-specific **Trifecta** (Continence + Potency + Cancer Control) and **Pentafecta** (+ Negative Margins + No Complications) evaluation.

### 2. Intelligent Document Ingestion & Verification
- Scanned PDF and Operation Note text extraction with OCR confidence scoring.
- Side-by-side field review and deterministic patient matching with direct-to-record navigation.
- Discrepancy conflict resolution with mandatory clinical justification and permanent Caldicott audit logging.

### 3. Patient Digital PROM Assessment Portal
- Accessible, patient-friendly questionnaire flow for **IPSS** (Urinary bother, 0-35), **SHIM / IIEF-5** (Erectile potency, 1-25), and **24-hour Continence & Pad usage**.
- Atomic submission directly syncing to the patient's electronic health record and auto-completing follow-up milestones.

### 4. Standalone Governance & Admin Portal
- Dedicated admin portal (`/admin`) with role-based access control (Consultants, Nurses, Data Officers, Patients).
- Immutable **Caldicott Principle 7** audit trail logging all clinical views, mutations, approvals, and exports.
- National registry data exports with automated NHS Number / Hospital Number pseudonymization.

---

## 🚀 Available Commands

```bash
# Development (uses .env.development)
npm run dev

# Staging (uses .env.staging)
npm run dev:staging

# Production build (uses .env.production)
npm run build && npm start

# Start PostgreSQL and apply migrations (self-hosted stack)
cd infra && cp .env.example .env && docker compose --env-file .env up -d && cd ..
npm run db:migrate

# Seed synthetic patients into a non-production tier
npm run db:seed 200

# Typecheck
npm run typecheck
```

See [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md) for environment setup and how
the first administrator is provisioned, and
[docs/MIGRATION_OFF_SUPABASE.md](docs/MIGRATION_OFF_SUPABASE.md) for the
self-hosted architecture.

---

## 🏗 Architecture

| Layer | Implementation |
| :--- | :--- |
| **Database** | Self-hosted PostgreSQL 16 (Docker / on-prem / any cloud VM). No managed service — data lives on the client's own server |
| **Access control** | Row level security. Clinicians see the registry; a patient sees only the record their profile links to; the audit trail is readable by governance only |
| **Derived clinical values** | Computed in Postgres — ISUP grade group, biochemical recurrence (`PSA >= 0.2`), the 7-milestone follow-up schedule, and record completeness |
| **Audit trail** | Append-only `audit_log`. Actor identity is read from the session inside a security-definer function, so it cannot be supplied by the client. `UPDATE`/`DELETE` are revoked |
| **Auth** | Own authentication: scrypt password hashing, `jose` JWT session cookie, verified in middleware. Roles come from the `profiles` table, never from the login form |
| **API** | Next.js Route Handlers (`app/api/**`) over a `pg` pool; the browser never touches the database directly |
| **Frontend** | Next.js 15 App Router, React 19, Tailwind, Recharts |

---

## 📚 Architectural Decision Records (ADRs)

- [ADR-001: In-Memory Caching & Performance Layer](file:///c:/Users/Kannan/Documents/Vivek/docs/decisions/ADR-001-In-Memory-Caching-And-Performance.md)
- [ADR-002: Caldicott Principle 7 Immutable Audit Trail](file:///c:/Users/Kannan/Documents/Vivek/docs/decisions/ADR-002-Caldicott-Principle-7-Audit-Trail.md)
- [ADR-003: Synthetic Clinical Cohort Generator & Benchmark Engine](file:///c:/Users/Kannan/Documents/Vivek/docs/decisions/ADR-003-Synthetic-Clinical-Cohort-Benchmarking.md)
- [Client Specification & End-to-End Flow Guide](file:///c:/Users/Kannan/Documents/Vivek/docs/CLIENT_SPECIFICATION_AND_FLOW_GUIDE.md)
