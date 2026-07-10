import { NextRequest, NextResponse } from 'next/server';

// Server-side env var — read at runtime, NOT baked in at build time.
// Set BACKEND_URL in Vercel's frontend project Environment Variables.
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

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
