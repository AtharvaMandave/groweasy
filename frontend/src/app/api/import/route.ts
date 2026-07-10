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
      // Do NOT set Content-Type — fetch sets it automatically with the correct boundary
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error('[proxy /api/import]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to reach backend. Check BACKEND_URL.' },
      { status: 502 }
    );
  }
}
