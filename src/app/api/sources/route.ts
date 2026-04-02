import { NextResponse } from 'next/server';
import { readSourceHealth } from '@/lib/storage';

export async function GET() {
  const health = await readSourceHealth();
  return NextResponse.json(health);
}
