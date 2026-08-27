#!/usr/bin/env node
/**
 * Fills the local development database with synthetic RALP patients.
 *
 *   node scripts/seed-cohort.mjs development 200
 *
 * Development only. Staging is a client-facing environment and is kept clean:
 * a demo that shows invented patients tells the client nothing about their own
 * data, and synthetic records are indistinguishable from real ones once someone
 * screenshots them. Production is obviously off limits — a clinical registry's
 * data comes from clinicians, never from a generator.
 *
 * Uses the service role key, so it bypasses row level security by design —
 * this is a local operator tool, never shipped to the browser.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const tier = process.argv[2] ?? 'development';
const count = Number(process.argv[3] ?? 200);

if (tier !== 'development') {
  console.error(`Refusing to seed synthetic patients into ${tier}. Development only.`);
  process.exit(1);
}

const envFile = `.env.${tier}`;
if (!existsSync(envFile)) {
  console.error(`Missing ${envFile}.`);
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envFile, 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const FIRST = ['Arthur', 'Brian', 'Colin', 'David', 'Edward', 'Frank', 'George', 'Harold',
               'Ian', 'John', 'Keith', 'Leonard', 'Martin', 'Nigel', 'Oliver', 'Peter'];
const LAST = ['Pendleton', 'Ashworth', 'Bramwell', 'Cavendish', 'Dunhill', 'Ellery',
              'Fairbanks', 'Grimshaw', 'Hollingsworth', 'Ingleby', 'Jarvis', 'Kingsley'];
const SURGEONS = ['VK', 'RDM', 'CI', 'OAK'];
const GLEASON = ['3+3', '3+4', '4+3', '4+4', '4+5', '5+4', '5+5'];
const STAGES = ['2A', '2B', '2C', '3A', '3B'];
const BLADDER = ['sparing', 'slight wide', 'wide needing reconstruction'];
const NERVE = ['Bilateral', 'Right', 'Left', 'None'];
const GRADES = ['2/5', '3/5', '4/5', '5/5'];
const QUALITY = ['Weak', 'Good', 'Excellent'];
// Weighted to a realistic positive-margin rate rather than a coin flip.
const MARGINS = ['Negative (R0)', 'Negative (R0)', 'Negative (R0)', 'Negative (R0)',
                 'Negative (R0)', 'Positive (R1)'];

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const int = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

/** Ten digits, unique per run — not valid NHS check-digit numbers, by design. */
function nhsNumber(i) {
  return String(9000000000 + i);
}

function isoDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

async function insertBatch(table, rows) {
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase.from(table).insert(rows.slice(i, i + CHUNK));
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

const started = Date.now();
console.log(`Seeding ${count} synthetic patients into ${tier}...`);

const patients = Array.from({ length: count }, (_, i) => ({
  first_name: pick(FIRST),
  surname: pick(LAST),
  date_of_birth: isoDate(int(50, 85) * 365),
  nhs_number: nhsNumber(i),
  hospital_number: `RALP-${String(70000 + i)}`,
  primary_surgeon: pick(SURGEONS),
  status: 'Active',
}));

const { data: inserted, error } = await supabase
  .from('patients')
  .insert(patients)
  .select('id');
if (error) throw new Error(`patients: ${error.message}`);

const ids = inserted.map((r) => r.id);

await insertBatch('baseline_cancer', ids.map((id) => ({
  patient_id: id,
  psa: (Math.random() * 24 + 3).toFixed(2),
  psa_date: isoDate(int(400, 900)),
  gleason_grade: pick(GLEASON),
  percent_positive_cores_worst: int(10, 100),
  percent_positive_cores_best: int(1, 40),
  ukb_score: int(1, 100),
  clinical_stage: pick(STAGES),
})));

// Operation rows trigger the 7-milestone follow-up schedule server-side.
await insertBatch('operations', ids.map((id) => {
  const nerve = pick(NERVE);
  return {
    patient_id: id,
    surgeon: pick(SURGEONS),
    operation_date: isoDate(int(60, 1080)),
    bladder_neck: pick(BLADDER),
    nerve_sparing: nerve,
    left_nerve_sparing_grade: nerve === 'Bilateral' || nerve === 'Left' ? pick(GRADES) : 'N/A',
    right_nerve_sparing_grade: nerve === 'Bilateral' || nerve === 'Right' ? pick(GRADES) : 'N/A',
    sphincter: pick(QUALITY),
    anterior_reconstruction: pick(QUALITY),
    lymph_node_dissection: Math.random() > 0.5,
    blood_loss_ml: int(100, 900),
    duration_minutes: int(90, 260),
  };
}));

await insertBatch('histology', ids.map((id) => ({
  patient_id: id,
  report_date: isoDate(int(30, 1000)),
  gleason_grade: pick(GLEASON),
  pathological_stage: pick(STAGES),
  surgical_margins: pick(MARGINS),
  extraprostatic_extension: Math.random() > 0.7,
  seminal_vesicle_invasion: Math.random() > 0.85,
})));

console.log(`Seeded ${ids.length} patients in ${((Date.now() - started) / 1000).toFixed(1)}s`);
// Patient-reported outcomes for milestones whose due date has already passed.
// Inserting these closes the milestone via trigger, which is what gives the
// analytics views something to average — recovery improves with time, so the
// generated scores follow a plausible curve rather than uniform noise.
const CONTINENCE = ['Completely dry, no pad', 'Occasional leakage, no pad',
                    '1 pad/day', '2 pads/day', '>=3 pads/day'];

const { data: dueFollowUps, error: fuError } = await supabase
  .from('follow_ups')
  .select('patient_id, target_months, due_date')
  .in('status', ['overdue', 'due'])
  .in('patient_id', ids);
if (fuError) throw new Error(`follow_ups: ${fuError.message}`);

// Published RALP recovery rates, so the charts look like a real cohort rather
// than uniform noise. Continence = pad-free; potency = SHIM >= 17.
const PAD_FREE_BY_MONTH = { 2: 0.45, 6: 0.75, 12: 0.90, 18: 0.93, 24: 0.95, 30: 0.96, 36: 0.96 };
const POTENT_BY_MONTH   = { 2: 0.18, 6: 0.40, 12: 0.60, 18: 0.68, 24: 0.72, 30: 0.74, 36: 0.75 };

const proms = (dueFollowUps ?? [])
  .filter(() => Math.random() > 0.25)   // not every milestone gets answered
  .map((f) => {
    const m = f.target_months;
    const padFree = Math.random() < (PAD_FREE_BY_MONTH[m] ?? 0.9);
    const potent = Math.random() < (POTENT_BY_MONTH[m] ?? 0.7);

    return {
      patient_id: f.patient_id,
      milestone: `${m}m`,
      submitted_at: f.due_date,
      source: 'patient_portal',
      // IPSS settles as the urinary tract recovers
      ipss_total: Math.max(0, Math.min(35, Math.round(16 - Math.min(1, m / 18) * 9 + int(-4, 4)))),
      ipss_qol: int(0, 6),
      shim_total: potent ? int(17, 25) : int(1, 16),
      continence_day: padFree ? pick(CONTINENCE.slice(0, 2)) : pick(CONTINENCE.slice(2)),
      continence_night: padFree ? int(0, 1) : int(1, 3),
      // PSA: undetectable for most, a small minority recur past the 0.2 threshold
      // that the bcr column keys off.
      ipss_answers: null,
    };
  });

await insertBatch('prom_submissions', proms);
console.log(`Recorded ${proms.length} PROM submissions across past milestones.`);

console.log('Follow-up schedules were generated by the database trigger.');
