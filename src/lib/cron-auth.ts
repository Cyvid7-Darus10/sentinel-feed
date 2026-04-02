import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify the CRON_SECRET bearer token on cron-invoked routes.
 * Returns null when auth succeeds, or a NextResponse error to return early.
 */
export function verifyCronAuth(request: NextRequest, label = 'cron'): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret) {
    console.error(`[${label}] CRON_SECRET env var is not set`);
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn(`[${label}] Auth failed — header present:`, !!authHeader);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
