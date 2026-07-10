import { NextRequest, NextResponse } from 'next/server';

const rawBackendUrl = process.env.BACKEND_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://groweasy-qilk.vercel.app' 
    : 'http://localhost:3001');

const BACKEND_URL = rawBackendUrl.replace(/\/$/, '');

export async function POST(request: NextRequest) {
  try {
    // Forward the raw FormData (with the CSV file) to the backend
    const formData = await request.formData();

    const backendRes = await fetch(`${BACKEND_URL}/api/import`, {
      method: 'POST',
      body: formData,
    });

    const contentType = backendRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status });
    } else {
      const text = await backendRes.text();
      return NextResponse.json(
        {
          success: false,
          error: `Backend returned status ${backendRes.status} (Non-JSON): ${text.slice(0, 300)}`
        },
        { status: backendRes.status }
      );
    }
  } catch (err) {
    console.error('[proxy /api/import]', err);
    return NextResponse.json(
      { success: false, error: `Failed to connect to backend at ${BACKEND_URL}: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }
}
