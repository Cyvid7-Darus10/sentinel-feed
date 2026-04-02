import { NextRequest, NextResponse } from 'next/server';
import { deleteOldBlobs } from '@/lib/storage';

const RETENTION_DAYS = 7;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deleted = await deleteOldBlobs(RETENTION_DAYS);

  return NextResponse.json({
    deleted: deleted.length,
    paths: deleted,
  });
}
