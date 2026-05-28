import { NextResponse } from 'next/server';
import { readSourceHealth } from '@/lib/storage';

export async function GET() {
  try {
    const health = await readSourceHealth();
    return NextResponse.json(health, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[sources] Failed:', message);
    return NextResponse.json(
      { sources: {}, updatedAt: new Date().toISOString() },
      { status: 500 }
    );
  }
}
