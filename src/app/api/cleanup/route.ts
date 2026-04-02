import { NextRequest, NextResponse } from 'next/server';
import { deleteOldBlobs } from '@/lib/storage';

const RETENTION_DAYS = 7;

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret) {
    console.error('[cleanup] CRON_SECRET env var is not set');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deleted = await deleteOldBlobs(RETENTION_DAYS);

    return NextResponse.json({
      deleted: deleted.length,
      paths: deleted,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[cleanup] Failed:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
