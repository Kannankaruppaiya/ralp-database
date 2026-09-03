import { NextResponse } from 'next/server';
import { requireUser, readJson } from '@/server/http/respond';
import { getPatients, createPatient } from '@/server/services/patients.service';
import type { PatientDemographics } from '@/types/patient';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const num = (k: string) => {
    const v = url.searchParams.get(k);
    return v ? Number(v) : undefined;
  };
  const result = await getPatients(auth.userId, {
    search: url.searchParams.get('search') ?? undefined,
    surgeon: url.searchParams.get('surgeon') ?? undefined,
    stage: url.searchParams.get('stage') ?? undefined,
    status: url.searchParams.get('status') ?? undefined,
    page: num('page'),
    pageSize: num('pageSize'),
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await readJson<Partial<PatientDemographics>>(request);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  const patient = await createPatient(auth.userId, body);
  return NextResponse.json({ patient }, { status: 201 });
}
