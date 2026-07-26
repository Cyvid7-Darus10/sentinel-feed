import { NextRequest, NextResponse } from 'next/server';
import { readSourceHealth } from '@/lib/storage';
import { PUBLIC_GET_HEADERS, hasOnlyAllowedParams } from '@/lib/config';

export async function GET(request: NextRequest) {
  // This route takes no parameters; reject any so the CDN can't be forced into
  // unbounded cache-miss origin invocations via throwaway query strings.
  if (!hasOnlyAllowedParams(request.nextUrl.searchParams, [])) {
    return NextResponse.json(
      { error: 'Unsupported query parameter' },
      { status: 400, headers: PUBLIC_GET_HEADERS }
    );
  }

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
