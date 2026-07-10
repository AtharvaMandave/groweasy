import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/health`);
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch {
    return NextResponse.json({ status: 'error', error: 'Backend unreachable' }, { status: 502 });
  }
}
