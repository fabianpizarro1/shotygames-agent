import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_SESION } from '@/lib/auth';

export async function POST() {
  (await cookies()).delete(COOKIE_SESION);
  return NextResponse.json({ ok: true });
}
