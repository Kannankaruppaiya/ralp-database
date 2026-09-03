import 'server-only';
import { withUser } from '@/server/db/pool';
import * as repo from '@/server/db/repositories/patients.repo';
import { writeAudit } from '@/server/db/repositories/clinical.repo';
import {
  toPatient, stripNhs, fromBaseline, fromOperation, fromHistology,
} from '@/lib/mappers';
import type { PatientFullRecord, PatientDemographics } from '@/types/patient';
import type { BaselineCancerData } from '@/types/cancer';
import type { OperationData } from '@/types/operation';
import type { HistologyData } from '@/types/histology';

export interface PatientQuery {
  search?: string;
  surgeon?: string;
  stage?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function getPatients(userId: string, q: PatientQuery = {}) {
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 25;

  // Same sanitising the old client used: strip the characters that were special
  // to the PostgREST filter grammar, so a search term stays a plain substring.
  let searchTerm: string | undefined;
  let searchDigits: string | undefined;
  if (q.search && q.search.trim().length >= 2) {
    searchTerm = q.search.trim().replace(/[,()"\\*%]/g, '');
    const digits = stripNhs(searchTerm);
    if (digits.length >= 3) searchDigits = digits;
  }

  const result = await withUser(userId, (client) =>
    repo.listPatients(client, {
      searchTerm,
      searchDigits,
      surgeon: q.surgeon && q.surgeon !== 'ALL' ? q.surgeon : undefined,
      status: q.status && q.status !== 'ALL' ? q.status : undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    })
  );

  let patients = result.rows.map(toPatient);
  // Stage spans two tables (clinical vs pathological); narrowed after mapping,
  // exactly as before.
  if (q.stage && q.stage !== 'ALL') {
    patients = patients.filter(
      (p) => p.baseline?.clinicalStage === q.stage || p.histology?.pathologicalStage === q.stage
    );
  }
  return { patients, total: result.total };
}

export async function getPatientById(userId: string, id: string): Promise<PatientFullRecord | null> {
  const row = await withUser(userId, (client) => repo.getPatientById(client, id));
  return row ? toPatient(row) : null;
}

export async function createPatient(
  userId: string, d: Partial<PatientDemographics>
): Promise<PatientFullRecord> {
  return withUser(userId, async (client) => {
    const id = await repo.insertPatient(client, {
      firstName: d.firstName, surname: d.surname, dateOfBirth: d.dateOfBirth,
      nhsNumber: stripNhs(d.nhsNumber ?? ''), hospitalNumber: d.hospitalNumber,
      phone: d.phone ?? null, email: d.email ?? null, address: d.address ?? null,
      postcode: d.postcode ?? null, primarySurgeon: d.primarySurgeon,
      otherSurgeonName: d.otherSurgeonName ?? null,
    });
    await writeAudit(client, 'PATIENT_CREATED', id, `Registered ${d.firstName} ${d.surname}`);
    const row = await repo.getPatientById(client, id);
    return toPatient(row);
  });
}

export async function updatePatient(
  userId: string, id: string, d: Partial<PatientDemographics>
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (d.firstName !== undefined) patch.first_name = d.firstName;
  if (d.surname !== undefined) patch.surname = d.surname;
  if (d.dateOfBirth !== undefined) patch.date_of_birth = d.dateOfBirth;
  if (d.nhsNumber !== undefined) patch.nhs_number = stripNhs(d.nhsNumber);
  if (d.hospitalNumber !== undefined) patch.hospital_number = d.hospitalNumber;
  if (d.phone !== undefined) patch.phone = d.phone;
  if (d.email !== undefined) patch.email = d.email;
  if (d.address !== undefined) patch.address = d.address;
  if (d.postcode !== undefined) patch.postcode = d.postcode;
  if (d.primarySurgeon !== undefined) patch.primary_surgeon = d.primarySurgeon;

  await withUser(userId, async (client) => {
    await repo.updatePatient(client, id, patch);
    await writeAudit(client, 'PATIENT_UPDATED', id, 'Demographics amended');
  });
}

export async function updateBaseline(userId: string, patientId: string, d: Partial<BaselineCancerData>) {
  await withUser(userId, (client) =>
    repo.upsertSection(client, 'baseline_cancer', patientId, fromBaseline(patientId, d)));
}

export async function updateOperation(userId: string, patientId: string, d: Partial<OperationData>) {
  await withUser(userId, (client) =>
    repo.upsertSection(client, 'operations', patientId, fromOperation(patientId, d)));
}

export async function updateHistology(userId: string, patientId: string, d: Partial<HistologyData>) {
  await withUser(userId, (client) =>
    repo.upsertSection(client, 'histology', patientId, fromHistology(patientId, d)));
}
