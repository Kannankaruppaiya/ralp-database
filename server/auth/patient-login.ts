import 'server-only';
import { withUser } from '@/server/db/pool';

/**
 * Signing in as a patient. The credential is the three mandatory fields the
 * registration form already collects, so a patient can reach the portal as soon
 * as a clinician has created their record — there is no separate provisioning
 * step and no backfill for patients who already exist.
 *
 * The account rows are created on first sign-in rather than at registration, so
 * one code path serves both. Once they exist, everything downstream — the
 * session cookie, loadProfile, row level security — is unchanged.
 */
export type PatientLoginResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'not_found' | 'ambiguous' };

export interface PatientLoginInput {
  firstName: string;
  surname: string;
  /** 'YYYY-MM-DD' */
  dateOfBirth: string;
}

export async function signInPatient(input: PatientLoginInput): Promise<PatientLoginResult> {
  return withUser(null, async (client) => {
    // Deceased patients are refused. Discharged and Under Surveillance are not:
    // the follow-up schedule runs to 36 months and they may still owe PROMs.
    const { rows: matches } = await client.query(
      `select id, first_name, surname, email
         from patients
        where lower(first_name) = lower($1)
          and lower(surname)    = lower($2)
          and date_of_birth     = $3
          and status <> 'Deceased'
        limit 2`,
      [input.firstName.trim(), input.surname.trim(), input.dateOfBirth]
    );

    if (matches.length === 0) return { ok: false, reason: 'not_found' };
    // Two people can share a name and a birthday. Choosing one of them would
    // open the wrong person's oncology record, so refuse and send them to the
    // clinic instead.
    if (matches.length > 1) return { ok: false, reason: 'ambiguous' };

    const patient = matches[0];

    const { rows: existing } = await client.query(
      'select id from profiles where patient_id = $1 and role = $2',
      [patient.id, 'Patient']
    );
    if (existing[0]) return { ok: true, userId: existing[0].id };

    // users.email is NOT NULL UNIQUE; not every patient record carries one.
    const email = (patient.email as string | null) ?? `patient+${patient.id}@ralp.local`;
    // Not a scrypt$ hash, so verifyPassword rejects it for any input and this
    // account can never be used on the email-and-password route.
    const { rows: created } = await client.query(
      'insert into users (email, password_hash) values (lower($1), $2) returning id',
      [email, 'disabled']
    );
    const userId = created[0].id as string;

    await client.query(
      `insert into profiles (id, full_name, email, role, patient_id)
       values ($1, $2, lower($3), 'Patient', $4)`,
      [userId, `${patient.first_name} ${patient.surname}`, email, patient.id]
    );

    return { ok: true, userId };
  });
}
