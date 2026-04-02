import { NextResponse } from 'next/server';
import { readSourceHealth } from '@/lib/storage';

export async function GET() {
  try {
    const health = await readSourceHealth();
    return NextResponse.json(health);
  } catch {
    return NextResponse.json(
      { sources: {}, updatedAt: new Date().toISOString() },
      { status: 500 }
    );
  }
}
