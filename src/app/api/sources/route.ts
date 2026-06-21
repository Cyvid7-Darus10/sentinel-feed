import { NextResponse } from 'next/server';
import { readSourceHealth } from '@/lib/storage';
import { PUBLIC_GET_HEADERS } from '@/lib/config';

export async function GET() {
  try {
    const health = await readSourceHealth();
    return NextResponse.json(health, { headers: PUBLIC_GET_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[sources] Failed:', message);
    return NextResponse.json(
      { sources: {}, updatedAt: new Date().toISOString() },
      { status: 500 }
    );
  }
}
