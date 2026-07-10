import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/health`);
    const contentType = backendRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status });
    } else {
      const text = await backendRes.text();
      return NextResponse.json(
        { status: 'error', error: `Non-JSON response (Status: ${backendRes.status}): ${text.slice(0, 200)}` },
        { status: backendRes.status }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { status: 'error', error: `Backend unreachable at ${BACKEND_URL}: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }
}
