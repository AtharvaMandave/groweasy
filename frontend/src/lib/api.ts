import type { APIResponse } from './types';

// All requests go to Next.js API proxy routes on the same domain.
// The proxy (src/app/api/*) forwards to the real backend server-side.
// This eliminates CORS issues and removes the need for NEXT_PUBLIC_API_URL.
const API_BASE = '';

/**
 * Upload a CSV file to the backend for AI extraction.
 */
export async function importCSV(file: File): Promise<APIResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/import`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error || `Server error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Check backend health (via Next.js proxy).
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}
