import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/server/http/respond';
import { getPatientById, updatePatient } from '@/server/services/patients.service';
import type { PatientDemographics } from '@/types/patient';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const patient = await getPatientById(auth.userId, id);
  if (!patient) return NextResponse.json({ error: 'Patient not found.' }, { status: 404 });
  return NextResponse.json({ patient });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await readJson<Partial<PatientDemographics>>(request);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  await updatePatient(auth.userId, id, body);
  return NextResponse.json({ ok: true });
}
