# UK NHS Compliance Framework, and Whether NHS Hospital Data May Be Stored on Oracle

> **Status:** research / assessment, September 2026. Written for the RALP Surgical
> Outcomes Database v2.
> **Not legal advice.** Every item marked **[VERIFY]** must be confirmed in writing by
> the Trust's Information Governance team, the Caldicott Guardian / SIRO, or by Oracle
> before it is relied on contractually.

---

## 0. The two questions, answered up front

**Q1 — "What is the UK's HIPAA?"**
There isn't one. HIPAA is a single federal statute with a single enforcement body. The
UK equivalent is a **stack of six overlapping regimes** — data protection law, the
common law duty of confidentiality, the Caldicott regime, the NHS Data Security and
Protection Toolkit (DSPT), NHS England's cloud/off-shoring rules, and clinical-safety +
product-assurance standards (DCB0129 / DTAC, and medical-device law if the software
scores or advises). A system can be perfectly UK GDPR compliant and still be
un-deployable in an NHS Trust because it has no DSPT submission, no DTAC pack and no
DCB0129 clinical safety case. All six must be satisfied together.

**Q2 — "Does Oracle meet NHS compliance? Can NHS hospital data live there?"**
**Yes — conditionally, and it is already happening in production.** Oracle Health
(Cerner) runs live NHS electronic patient records, e.g. the North West London ICS is
fully live across 12 acute facilities covering a 2.4 million patient population, and
Royal Free, Imperial, Milton Keynes and Newcastle are named Oracle Health NHS
customers. NHS Shared Business Services runs Oracle Fusion on Oracle UK Sovereign
Cloud. NHS England's own Cloud Centre of Excellence publishes Oracle case studies and
OCI training material.

But **"Oracle" is not one product and compliance does not travel with the brand.** The
answer is yes *if and only if* the deployment is pinned to the UK regions, the
processor/sub-processor contract chain is correct, the Trust has done its DPIA and SIRO
sign-off, and the supplier (us) holds its own DSPT + DTAC + DCB0129. The
must-hold-true list is §5.4. The one real gap found in this research is §5.2: Oracle
**lists** NHS DSPT among the frameworks it addresses, but a *published, independently
audited DSPT status* for Oracle could not be located, whereas AWS publishes
"Standards Exceeded" for 2025-26. That is a procurement question to put to Oracle in
writing, not a blocker.

---

## 1. HIPAA → UK mapping

| HIPAA concept (USA) | UK / NHS equivalent |
| :--- | :--- |
| HIPAA Privacy Rule | **UK GDPR + Data Protection Act 2018** (health data = Art 9 special category; Art 9(2)(h) for health/care purposes) **+ the common law duty of confidentiality**, which is separate from and additional to data protection law |
| HIPAA Security Rule | **NHS DSPT** (built on the National Data Guardian's 10 Data Security Standards; now CAF-aligned for Trusts/ICBs) + **NCSC 14 Cloud Security Principles** + Cyber Essentials / ISO 27001 as evidence |
| Business Associate Agreement (BAA) | **UK GDPR Article 28 processor contract** + a **Data Sharing / Data Processing Agreement** with the Trust. There is no NHS-wide "sign the BAA" equivalent — each Trust contracts individually |
| Minimum necessary rule | **Caldicott Principles** (8 principles; use the minimum necessary, access on a strict need-to-know basis, and Principle 7 — the duty to share for care can be as important as the duty to protect) enforced by the Trust's **Caldicott Guardian** |
| HHS OCR (regulator) | **ICO** for data protection; **NHS England / DSPT** for assurance; **CQC** for care quality; **MHRA** if the software is a medical device |
| Breach notification | ICO within **72 hours** for a reportable personal data breach, plus reporting through the **DSPT incident reporting** route |
| De-identification / Safe Harbor | **Anonymisation / pseudonymisation** under the ICO code; for a registry, identifiers usually stay and the lawful route is instead Section 251 support (§4) |
| No direct HIPAA analogue | **DSPT annual submission (30 June)**, **DTAC**, **DCB0129 / DCB0160 clinical risk management**, **NHS England off-shoring & public cloud guidance**, **HSCN** connectivity, **Records Management Code of Practice** retention schedules |

The practical consequence: **an American "we are HIPAA compliant" claim buys nothing in
the NHS.** Oracle's HIPAA attestation and BAA programme are irrelevant evidence for an
NHS Trust; DSPT, ISO 27001, Cyber Essentials, NCSC alignment and UK data residency are
the currency.

---

## 2. The six regimes in detail

### 2.1 UK GDPR + Data Protection Act 2018
- Patient records here (name, surname, DOB, **NHS number**, hospital number, cancer
  staging, PSA, potency and continence scores) are **special category data** — the most
  tightly controlled class.
- A **DPIA is mandatory** for large-scale processing of special category data. The
  Trust, as controller, owns the DPIA; the supplier must feed it (architecture,
  sub-processors, data flows, retention, security controls).
- Lawful basis is normally Art 6(1)(e) public task + Art 9(2)(h) health care, or
  Art 9(2)(j) research/statistics for the audit side.
- **Data (Use and Access) Act 2025** (in force 19 June 2025; Art 6 "recognised
  legitimate interests" changes commenced 5 February 2026) amends the Health and Social
  Care Act 2012 to create **information standards that bind IT suppliers directly** for
  the first time — previously they bound NHS bodies only. It does **not** relax patient
  data security or who may access NHS data. Interoperability/standards obligations on
  EPR and registry suppliers are now a legal duty, not a procurement preference.

### 2.2 Common law duty of confidentiality
The regime that surprises non-UK teams. Independent of GDPR: information given in
confidence by a patient may not be used beyond the expectation under which it was
given. **Implied consent** covers direct care. Anything beyond direct care — a surgical
outcomes registry, unit-level benchmarking, national audit submission — needs an
explicit route: consent, Section 251 support (§4), or robust anonymisation.

### 2.3 Caldicott: Principles, Guardian, and the 10 Data Security Standards
- The **8 Caldicott Principles** govern the use of confidential patient information;
  Principle 7 (the duty to share can be as important as the duty to protect) is the one
  this codebase already cites for its immutable audit trail (see
  `docs/decisions/ADR-002-Caldicott-Principle-7-Audit-Trail.md`).
- Every registry/audit collecting patient-identifiable data must comply with Caldicott
  and be **approved by the Trust's Caldicott Guardian**.
- The **National Data Guardian's 10 Data Security Standards** are the content the DSPT
  tests: personal responsibility, staff training, access control, process reviews,
  leadership, incident response, continuity, unsupported software, IT protection, and
  **supplier assurance**.

### 2.4 NHS Data Security and Protection Toolkit (DSPT) — the closest thing to a HIPAA Security Rule audit
- Mandatory for **every organisation that accesses NHS patient data or systems** —
  including suppliers. Annual submission, deadline **30 June**.
- **Two tracks since 2024:**
  - **NHS Trusts, ICBs, CSUs, ALBs** moved to the **CAF-aligned DSPT** (NCSC Cyber
    Assessment Framework with a health overlay): outcome-based, 9 mandatory outcomes
    plus 3 organisation-chosen, and it asks *how effective* a control is in practice,
    not merely whether it exists. Independent assessments run roughly January–June.
  - **IT suppliers stay on the legacy (non-CAF) DSPT** until at least the 2026
    submission, **but with a mandatory independent audit** as part of that submission.
- **Supplier category test:** >50 staff **and** >£10m turnover **and** supplying digital
  goods/services to health or care ⇒ "IT supplier", Category 2. A small dev shop below
  that threshold still submits, at a lighter category — **[VERIFY]** our own
  organisation's category and whether an independent assessment is required this cycle.
- Statuses: *Standards Not Met / Approaching Standards / Standards Met / Standards
  Exceeded*. Trusts routinely refuse to onboard a supplier below **Standards Met**, and
  it is a standard procurement gate.

### 2.5 NHS England cloud & off-shoring rules (the residency question)
Guidance published jointly by NHS England, DHSC and NHS Improvement:
- Data may be hosted in the **UK, the EEA, or a territory the UK deems adequate** (ICO
  international transfers list); US hosting is possible only under an **IDTA** and with
  **SIRO and Executive Management Team approval**. A 2017 NHS Executive Management Team
  mandate repatriated NHS cloud services and data to **UK regions**, and hosting outside
  the UK requires SIRO + EMT approval. **Treat "UK-only" as the design rule.**
- The **controller stays the controller.** The cloud provider is a processor; the Trust
  cannot outsource accountability. The SIRO must be satisfied on security, and the DPO
  must run a DPIA.
- Alignment with the **NCSC 14 Cloud Security Principles** is the NHS's stated core
  means of assessing cloud security, and that alignment is the evidence the DPIA and
  ICO accountability records rest on.

### 2.6 Clinical safety, product assurance, and medical-device law
- **DCB0129** — clinical risk management for the **manufacturer** of a health IT system.
  **This applies to us.** It requires a named **Clinical Safety Officer** (a registered
  clinician trained in clinical risk management; may be an outsourced third party), a
  hazard log and a **Clinical Safety Case Report**.
- **DCB0160** — the equivalent duty on the **deploying** Trust.
- **DTAC (Digital Technology Assessment Criteria)** — NHS England's pre-procurement
  assessment covering clinical safety, data protection, technical security,
  interoperability and usability/accessibility. It was refreshed and **the updated DTAC
  form replaced the previous version from 6 April 2026**; the refresh added a decision
  tree for whether a product is a medical device, auto-triggers the Product Assurance
  Questionnaire for medical-device software, and removed the NHS-specific CSO training
  requirement.
- **Medical device risk — read this carefully.** Automatic scoring (IPSS, SHIM), derived
  ISUP grade group, Trifecta/Pentafecta benchmarking and especially **automated
  biochemical-recurrence alerts at PSA ≥ 0.2 ng/mL** are the features that push software
  from "record keeping" toward **clinical decision support**, which can be a regulated
  medical device under the UK MDR 2002 (MHRA), typically Class IIa. Run the DTAC
  decision tree and record the outcome. **[VERIFY]** — this is the single highest-impact
  unresolved regulatory question for this product, because a device classification adds
  a UKCA route, a QMS (ISO 13485) and post-market surveillance.
- Supporting: **Cyber Essentials Plus** and/or **ISO 27001** as security evidence,
  **HSCN**/nhs.net for connectivity and correspondence, **Records Management Code of
  Practice 2023** retention schedules, ROPA, and a documented breach process.

---

## 3. Where this project sits today (honest gap analysis)

Current architecture (from `README.md`, `docs/DEPLOYMENT.md`, `ADR-004`): self-hosted
PostgreSQL 16 in Docker, Next.js route handlers, own scrypt+JWT auth, RLS, append-only
`audit_log`, AWS EC2 test box with **synthetic data only**, real records only on the
client's own server.

**Already aligned with the UK regime**
- Vendor-neutral self-hosting and the "real data only on the client's own server" rule
  directly serve the UK residency mandate and Caldicott.
- Append-only audit log with actor identity resolved server-side, `UPDATE`/`DELETE`
  revoked — strong DSPT access-control and audit evidence.
- RLS as a second wall; patients scoped to their own record.
- Pseudonymised registry export path (`app/api/exports/pseudonymised/route.ts`,
  `db/migrations/0008_registry_export_views.sql`) — the right shape for NPCA/BAUS
  submission.
- Tier separation with a visual non-production banner; synthetic-only test box.

**Gaps to close before any real patient record is entered**
1. **Encryption at rest is not evidenced.** A Docker volume on a VM is not encrypted by
   default. Need full-disk/volume encryption plus documented key management. DSPT and
   the NCSC principles both probe this.
2. **Backups are a manual `pg_dump`.** ADR-004 admits it: "must be scheduled by whoever
   operates the deployment." Business continuity is an explicit NDG standard — needs a
   scheduled, encrypted, tested, off-box, UK-resident backup with a documented RPO/RTO
   and a restore rehearsal record.
3. **No DPIA, no Clinical Safety Case Report, no DTAC pack, no hazard log in the repo.**
   These are deliverables, not paperwork-after-go-live.
4. **No DSPT submission for the supplier organisation** (§2.4) — **[VERIFY]** status and
   category.
5. **No Article 28 processor contract / DSA** between the Trust and us recorded anywhere
   in the repo.
6. **MFA is absent** — auth is password + JWT cookie only. Clinical access to
   identifiable data without MFA is difficult to defend in a CAF-aligned assessment.
7. **Retention and destruction** are undefined (Records Management Code of Practice).
8. **No independent penetration test / vulnerability management evidence.**
9. `README.md` links ADRs as `file:///c:/Users/Kannan/...` local paths — cosmetic, but
   an IG reviewer reading the repo will notice.

---

## 4. Registry-specific legal route (do not skip)

A RALP outcomes registry with NHS number and hospital number is **not purely direct
care**. Unit benchmarking, surgeon-level Trifecta/Pentafecta comparison and national
submission are secondary uses of confidential patient information.

- Established NHS clinical registries and audits typically operate under **Section 251
  of the NHS Act 2006**, which permits use of patient-identifiable data without consent
  where anonymised data will not do and consent is impracticable.
- Applications are considered by the HRA's **Confidentiality Advisory Group (CAG)**,
  with the **HRA as decision maker**, and by a **Research Ethics Committee** where
  relevant; research applications route via IRAS.
- All registries/audits collecting identifiable data must comply with Caldicott and be
  **approved by the local Caldicott Guardian**.
- Decide and document, per purpose: **direct care** (implied consent) vs **local
  clinical audit** (Trust authority + Caldicott Guardian) vs **research / national
  registry** (s251 / CAG, or explicit consent). Each purpose gets its own lawful basis
  line in the DPIA. NHS England's *Clinical audits and registries: a best practice
  guide* is the reference text.

---

## 5. Oracle assessment

### 5.1 UK footprint — which Oracle you buy matters
Two **separate, physically isolated realms**, both live:

| Realm | Regions | Who may use it | Posture |
| :--- | :--- | :--- | :--- |
| **OCI commercial** | **UK South (London)** `uk-london-1`, **UK West (Newport)** `uk-cardiff-1` | any customer | Normal public cloud, UK data centres, global Oracle support model |
| **Oracle UK Sovereign Cloud** | **UK Gov South (London)**, **UK Gov West (Newport)** | eligible organisations only | Realm physically isolated from every other Oracle realm; a tenancy exists in one realm only and cannot reach another. Control, monitoring and logging systems are self-contained in-realm and located in the UK. Operations, support and security are performed **only by UK citizens, UK-resident (≥5 years), holding UK SC clearance**. Data centres hold **PASF** accreditation; regions align to NCSC principles and are built to the parameters needed for **UK OFFICIAL-SENSITIVE**. Content does not leave the environment. London live 3 Dec 2019, Newport live 31 Jul 2020, connected by an Oracle-owned private backbone |

**Eligibility caveat:** Oracle's public pages describe the Sovereign Cloud as being for
"eligible government and defence customers" and the FAQ answers *who is eligible* with
"contact your Oracle representative." Secondary sources describing Oracle's eligibility
criteria list **UK government departments, devolved governments, agencies, police, fire
and rescue, UK ambulance services, NHS entities, other UK public sector bodies**, plus
certain NATO-member defence companies, SIs and MSPs **holding a contract with an
eligible government or NHS entity** — which would cover us as the Trust's supplier.
**[VERIFY] in writing with Oracle before designing around it.**

### 5.2 Oracle's compliance posture against the NHS regime
Verified directly from Oracle's UK cloud compliance page (fetched 21 Sep 2026):
- **NHS DSPT is listed by name** on Oracle's cloud compliance page, described as "a
  self-assessment and attestation framework that establishes information security and
  data protection requirements for organisations that access, process, store, or share
  NHS data and systems," covering governance, risk management, data protection, IAM,
  staff training, incident management, business continuity, **supplier assurance** and
  technical security.
- Also listed: **ISO/IEC 27001**, 27017, 27018, **27701**, **Cyber Essentials** (UK
  government scheme), **UK Government G-Cloud framework**, **NCSC 14 Cloud Security
  Principles**, **CSA STAR**, EU Cloud Code of Conduct (Level 2 verified), SOC 1/2/3,
  **TDAP–PASF** (UK policing assurance for cloud hosting facilities), and **HDS**
  (*Hébergeur de Données de Santé* — the French mandatory health-data hosting
  certification, with dedicated OCI and SaaS HDS offerings).
- **The gap:** listing a framework is not the same as publishing a completed
  submission. **No published, independently audited Oracle DSPT status could be
  located** in this research — and the DSPT publication site is unreachable from this
  environment, so absence here is not proof of absence. For contrast, AWS publicly
  announces completion of its **2025-26 NHS DSPT assessment audit with "Standards
  Exceeded."** **[VERIFY] — ask Oracle for: (a) their DSPT organisation code and
  published status, (b) the independent assessment report, (c) which OCI services and
  which UK regions are in scope.** Get it in the contract, not in a slide.
- **HDS is genuinely useful evidence** — it proves Oracle operates infrastructure
  certified for hosting identifiable health data under a European national health
  regime. It is *not* NHS assurance and no Trust will accept it as a DSPT substitute,
  but it strengthens the DPIA narrative.

### 5.3 Contract chain, transfers, and the US-ownership question
- Controller/processor chain: **Trust = controller → us = processor → Oracle =
  sub-processor.** Oracle must be named as a sub-processor in our agreement with the
  Trust, and the Trust's approval of sub-processors obtained.
- Oracle's **Data Processing Agreement for Oracle Services** (current version dated
  Aug 2025) and a separate **Oracle Health DPA** exist. For restricted transfers out of
  the UK not covered by an ICO adequacy decision, Oracle applies **EU Model Clauses as
  supplemented by the UK International Data Transfer Addendum (v B1.0)** — i.e. the
  paperwork exists, which also tells you transfers out of the UK are contemplated by
  default. **Pin data location contractually to the UK regions** and require written
  approval before any sub-processor or support access outside the UK.
- **US CLOUD Act exposure** is real but not Oracle-specific: AWS, Microsoft and Google
  carry it identically, and the NHS uses all three. Standard mitigations: UK-only
  regions (or the Sovereign realm with SC-cleared UK-only staff), **customer-managed
  keys** (OCI Vault, or hold keys outside the provider), encryption in transit and at
  rest, contractual notification obligations, and recording the residual risk in the
  DPIA for SIRO acceptance. Do not present it as solved; present it as assessed.

### 5.4 Verdict: can NHS hospital data be stored on Oracle?
**Yes — conditionally.** Every one of these must hold true:

1. Deployment pinned to **UK regions only** (`uk-london-1` / `uk-cardiff-1`, or the UK
   Gov regions if eligible) — including **backups, DR copies, object storage, logs and
   telemetry**, which is where residency breaches usually hide.
2. Trust **DPIA completed** and **SIRO + DPO + Caldicott Guardian sign-off** recorded
   before go-live.
3. **Article 28 processor contract** in place, Oracle named and approved as
   sub-processor, data location and support-access locations written in.
4. **Oracle's DSPT status obtained in writing** (§5.2) and filed as supplier-assurance
   evidence for the Trust's own DSPT.
5. **Our organisation** holds its own DSPT (at least *Standards Met*), a completed
   **DTAC**, and a **DCB0129 Clinical Safety Case Report** with a named Clinical Safety
   Officer.
6. **Encryption at rest with customer-managed keys**, encryption in transit, MFA on all
   clinical and admin access, least-privilege IAM, and no shared accounts.
7. Alignment to the **NCSC 14 Cloud Security Principles** documented control-by-control
   as DPIA evidence.
8. Backup/DR: encrypted, scheduled, UK-resident, **restore-tested**, with documented
   RPO/RTO and retention aligned to the Records Management Code of Practice.
9. Audit logging retained and immutable (already the case in-app — extend to
   infrastructure: OCI Audit, VCN flow logs, admin actions).
10. The registry's secondary-use route (§4) documented and approved.

### 5.5 If we do move to Oracle, which shape?

| Option | Fit | Verdict |
| :--- | :--- | :--- |
| **OCI Compute in `uk-london-1` running our existing Docker Postgres** | Identical to the current stack; ADR-004's vendor-neutrality preserved; DR to `uk-cardiff-1` | **Recommended** if Oracle is chosen. Zero code change — only `DATABASE_URL` and the `.env` values move, exactly as `docs/DEPLOYMENT.md` describes |
| **OCI Database with PostgreSQL** (managed) | Managed patching and backups; **encryption always on, in transit and at rest**; 99.99% SLA; automatic backups with retention up to 35 days; multi-fault-domain/AD HA with automatic failover to a standby | Good second choice — it closes gaps 1 and 2 of §3 by itself. **[VERIFY] availability in the UK regions**, and that RLS, security-definer functions and our forward-only migration tooling run unmodified |
| **Autonomous Database / Exadata** | Over-specified for this workload, and the schema leans on PostgreSQL-specific behaviour — RLS policies, security-definer audit functions, generated/derived columns | **Not recommended.** A rewrite with no clinical benefit |
| **Oracle UK Sovereign Cloud (UK Gov regions)** | Strongest IG posture available: isolated realm, SC-cleared UK-only operations, PASF, OFFICIAL-SENSITIVE parameters | **Best posture if eligible** — pursue via the Trust's contract. **[VERIFY] eligibility and service availability**, as the sovereign realm does not always carry the full commercial service catalogue |

**Also worth stating plainly:** nothing in this research says we *must* move to Oracle.
The current self-hosted-on-the-Trust's-own-server model is, from a pure IG standpoint,
the *easiest* posture to defend — no sub-processor, no cross-border transfer question,
no CLOUD Act paragraph in the DPIA. The trade is that backups, patching, uptime and
encryption-at-rest become entirely our discipline (ADR-004 says as much). Oracle buys
managed durability at the cost of a sub-processor chain. Both are defensible; the
decision belongs to the Trust's SIRO, not to engineering.

---

## 6. Recommended next actions

**Immediate (before any real patient record is entered anywhere)**
1. Draft the **DPIA** input pack: data flows, data items, purposes, lawful bases,
   retention, sub-processors, security controls, residual risks.
2. Appoint a **Clinical Safety Officer** and open the **hazard log**; start the DCB0129
   Clinical Safety Case Report.
3. Run the **DTAC medical-device decision tree** on the automated scoring and the
   PSA ≥ 0.2 biochemical-recurrence alerting, and record the outcome (§2.6).
4. Turn on **volume encryption** and a **scheduled, encrypted, restore-tested backup**
   on whichever host holds real data — this is the largest technical gap today.
5. Add **MFA** to clinician and admin authentication.

**Procurement track (in parallel)**
6. Ask Oracle, in writing: DSPT organisation code and published status; independent
   assessment report; in-scope services and UK regions; UK Sovereign Cloud eligibility
   for an NHS supplier; support-access locations; sub-processor list; UK data-location
   commitment; whether OCI Database with PostgreSQL is live in the UK regions.
7. Confirm **our own DSPT category** and submission status (deadline 30 June).
8. Get the **Article 28 / DSA** template from the Trust's IG team and map it against
   what the architecture actually does.
9. Agree the **secondary-use route** (§4) with the Caldicott Guardian — and whether a
   CAG/s251 application is needed for surgeon-level benchmarking and national
   submission.

**Documentation debt**
10. Add `docs/INFORMATION_GOVERNANCE.md` (controls ↔ DSPT/NDG standards ↔ NCSC 14
    principles mapping — the artefact IG reviewers ask for first), a retention schedule,
    and fix the `file:///c:/Users/...` ADR links in `README.md`.

---

## 7. Research limitations

Several primary sources were unreachable from this environment (blocked by the network
egress policy): `digital.nhs.uk`, `dsptoolkit.nhs.uk`, `docs.oracle.com` and
`aws.amazon.com`. For those, this document relies on search-result summaries and
secondary commentary rather than the primary text. Oracle's UK cloud compliance page,
the UK Sovereign Cloud pages and Oracle's public cloud region list **were** fetched and
read directly. Every **[VERIFY]** marker flags a point where the primary source should
be read, or a written answer obtained, before the statement is relied on.

---

## 8. Sources

NHS / UK regime
- [Data Security and Protection Toolkit](https://www.dsptoolkit.nhs.uk/)
- [DSPT — NHS Standards Directory](https://standards.nhs.uk/published-standards/data-security-and-protection-toolkit)
- [DSPT Independent Assessment Guides 25-26 v8 for IT Suppliers](https://www.dsptoolkit.nhs.uk/Help/Independent-Assessment-Guides)
- [CAF-aligned DSPT guidance — NHS England Digital](https://digital.nhs.uk/cyber-and-data-security/guidance-and-resources/caf-aligned-dspt-guidance/audit-guides/strengthening-assurance-independent-assessment-summary-of-guides/cyber-assessment-framework-caf-aligned-data-security-and-protection-toolkit-dspt/)
- [The NHS DSPT: what you need to know for 2025/26 — GRC Solutions](https://grcsolutions.io/the-nhs-dspt-data-security-and-protection-toolkit-what-you-need-to-know-for-2025-26/)
- [DSPT is now CAF-aligned: what NHS suppliers must do before 30 June 2026 — EJN Labs](https://ejnlabs.com/dspt-caf-aligned-nhs-suppliers/)
- [NHS and social care data: off-shoring and the use of public cloud services — NHS England Digital](https://digital.nhs.uk/data-and-information/looking-after-information/data-security-and-information-governance/nhs-and-social-care-data-off-shoring-and-the-use-of-public-cloud-services)
- [NHS Digital publishes guidance for health and care organisations using cloud services and data offshoring — Lexology](https://www.lexology.com/library/detail.aspx?g=14f17b16-383c-474c-8d7e-dde55f619a08)
- [Cloud security guidance — NHS England Digital](https://digital.nhs.uk/services/cloud-centre-of-excellence/strategy/nhs-cloud-policies-and-guidance/cloud-security-guidance)
- [NCSC cloud security principles](https://www.ncsc.gov.uk/collection/cloud/the-cloud-security-principles)
- [DTAC — assessment criteria, NHS Transformation Directorate](https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/assessment-criteria-assessed-section/)
- [New NHS Digital Technology Assessment Criteria: what health tech suppliers need to know — Burges Salmon](https://www.burges-salmon.com/articles/102mnjh/new-nhs-digital-technology-assessment-criteria-what-health-tech-suppliers-need-t/)
- [DTAC refreshed — HTN Health Tech News](https://htn.co.uk/2026/02/25/digital-technology-assessment-criteria-refreshed-to-create-simpler-more-trusted-pathway-for-nhs-digital-innovation/)
- [Using the DTAC — AI and Digital Regulations Service](https://digitalregulations.innovation.nhs.uk/regulations-and-guidance-for-developers/all-developers-guidance/using-the-digital-technology-assessment-criteria-dtac/)
- [Clinical audits and registries: a best practice guide — NHS England](https://www.england.nhs.uk/long-read/clinical-audits-registries-best-practice-guide/)
- [Confidential patient information and the Regulations — HRA](https://www.hra.nhs.uk/about-us/committees-and-services/confidentiality-advisory-group/confidential-patient-information-and-regulations/)
- [Guidance for CAG applicants — HRA](https://www.hra.nhs.uk/about-us/committees-and-services/confidentiality-advisory-group/guidance-cag-applicants/)
- [Information governance — NICOR (registry IG example)](https://www.nicor.org.uk/about-us/information-governance)
- [Data (Use and Access) Act 2025 — a health sector perspective, DAC Beachcroft](https://www.dacbeachcroft.com/en/What-we-think/The-new-data-use-and-access-act-2025-a-health-sector-perspective)
- [Data (Use and Access) Act becomes law — Osborne Clarke](https://www.osborneclarke.com/insights/data-use-and-access-act-becomes-law-first-ever-changes-uk-gdpr)
- [Data (Use and Access) Act 2025 and the NHS 10-Year Plan — Hempsons](https://www.hempsons.co.uk/news-articles/data-use-and-access-act-2025-and-nhs-10-year-plan/)

Oracle
- [Cloud Compliance — Oracle UK](https://www.oracle.com/uk/corporate/cloud-compliance/) (fetched directly; NHS DSPT, Cyber Essentials, ISO 27001/27017/27018/27701, G-Cloud, NCSC principles, TDAP-PASF, HDS)
- [Oracle UK Sovereign Cloud](https://www.oracle.com/uk/cloud/uk-sovereign-cloud/) and [FAQ](https://www.oracle.com/uk/cloud/uk-sovereign-cloud/faq/) (fetched directly)
- [Public cloud regions and data centres — Oracle UK](https://www.oracle.com/uk/cloud/public-cloud-regions/) (fetched directly; UK South/West and UK Gov South/West status)
- [OCI UK Government Cloud — Oracle docs](https://docs.oracle.com/en-us/iaas/Content/General/Concepts/govuksouth.htm)
- [Explore OCI Database with PostgreSQL](https://www.oracle.com/uk/cloud/postgresql/) and [FAQ](https://www.oracle.com/cloud/postgresql/faq/)
- [Health Data Host (HDS) for OCI — Oracle UK](https://www.oracle.com/uk/cloud/health-data-hosting-oci/)
- [Data Processing Agreement for Oracle Services (Aug 2025)](https://www.oracle.com/contracts/docs/data-processing-agreement-oracle-services-081425.pdf)
- [Data Processing Agreement for Oracle Health Services](https://www.oracle.com/contracts/docs/oracle-health-dpa-agreement.pdf)
- [North West London ICS fully live on Oracle Health EHR — Oracle](https://www.oracle.com/uk/news/announcement/north-west-london-integrated-care-system-now-fully-live-on-oracle-health-electronic-health-record-2024-03-14/)
- [Oracle Health UK](https://www.oracle.com/uk/industries/healthcare/)
- [Oracle NHS cloud case studies — NHS England Digital](https://digital.nhs.uk/services/cloud-centre-of-excellence/health-care-case-studies/oracle)
- [OCI training — NHS England Digital Cloud Centre of Excellence](https://digital.nhs.uk/services/cloud-centre-of-excellence/training/oracle)
- [NHS Shared Business Services on Oracle Fusion Cloud](https://www.oracle.com/customers/nhssbs/)
- [Oracle announces dual-region UK Government Cloud — Computing](https://www.computing.co.uk/news/4022262/oracle-announces-dual-region-uk-government-cloud-operating-centres-london-wales)

Comparator
- [AWS successfully completed its 2025-26 NHS DSPT assessment](https://aws.amazon.com/blogs/security/aws-successfully-completed-its-2025-26-nhs-dspt-assessment/)
- [AWS NHS DSPT](https://aws.amazon.com/compliance/nhs-dspt/)
- [Using AWS in the context of NHS cloud security guidance](https://docs.aws.amazon.com/whitepapers/latest/nhs-cloud-security-guidance-using-aws/nhs-cloud-security-guidance-using-aws.html)
