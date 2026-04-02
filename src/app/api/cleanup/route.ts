import { NextRequest, NextResponse } from 'next/server';
import { deleteOldBlobs } from '@/lib/storage';
import { verifyCronAuth } from '@/lib/cron-auth';
import { RETENTION_DAYS } from '@/lib/config';

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request, 'cleanup');
  if (authError) return authError;

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
