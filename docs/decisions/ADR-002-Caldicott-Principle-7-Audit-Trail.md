# ADR-002: Caldicott Principle 7 Immutable Clinical Audit Trail

## Status
Accepted

## Date
2026-08-27

## Context
UK NHS Information Governance and Caldicott Principle 7 mandate that all patient record accesses, clinical extractions, manual overrides, PROM submissions, and data exports must maintain an immutable, chronological audit trail recording the clinician's GMC Number/identity, timestamp, resource touched, and clinical rationale.

## Decision
Enforce universal audit event dispatching across all database mutation methods in `lib/api-client.ts`:
- `addAuditLog()` automatically generates sequential IDs and ISO timestamps.
- All clinical writes (`updateBaseline`, `updateOperation`, `updateHistology`, `updateFollowUp`, `addPromSubmission`, `saveIngestionJob`, `resolveConflict`) dispatch structured audit entries.
- The Admin Console exposes a dedicated `/admin/audit-log` view with filtering by action type, clinician, and date.

## Consequences
- 100% Caldicott Principle 7 & GDPR compliance for clinical surgical registries.
- Provides complete legal defensibility for AI-assisted OCR extraction approvals and clinical conflict resolutions.
