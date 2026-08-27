# ADR-003: Synthetic Clinical Cohort Generator & Benchmark Engine

## Status
Accepted

## Date
2026-08-27

## Context
Validating a longitudinal surgical database against 100,000+ national user scales requires high-density clinical test datasets that realistically model pre-op oncological baselines, intra-op surgical parameters, post-op histopathology, and 36-month follow-up trajectories (PSA nadir vs. recurrence, IPSS, SHIM, and Continence). Using live patient data in non-production environments violates patient privacy laws (GDPR / DPA 2018).

## Decision
Develop a native zero-dependency synthetic cohort engine (`scripts/generate-synthetic-cohort.mjs` and Admin UI integration):
- Generates realistic UK demographics with Modulus-11 checked NHS numbers.
- Computes clinically valid D'Amico risk categories, Cambridge Prognostic Groups (CPG), and Gleason migrations.
- Generates realistic 7-milestone longitudinal follow-up trajectories.
- Exposes CLI benchmarking (`npm run test:cohort`, `npm run test:cohort10k`) and in-browser interactive synthesis.

## Consequences
- Enables instant load testing with 10,000 synthetic patients in ~600ms.
- Allows rigorous offline benchmarking and QA verification without risking identifiable patient data.
