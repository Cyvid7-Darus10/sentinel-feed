import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/storage', () => ({
  deleteOldBlobs: vi.fn(),
}));

import { GET } from '../route';
import { deleteOldBlobs } from '@/lib/storage';

const mockDelete = vi.mocked(deleteOldBlobs);
const ORIGINAL_SECRET = process.env.CRON_SECRET;

function request(authHeader?: string): NextRequest {
  return new NextRequest('http://localhost/api/cleanup', {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe('GET /api/cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.CRON_SECRET = 'top-secret';
  });

  afterEach(() => {
    if (ORIGINAL_SECRET === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = ORIGINAL_SECRET;
    }
  });

  it('rejects unauthorized requests without deleting anything', async () => {
    const res = await GET(request('Bearer wrong'));

    expect(res.status).toBe(401);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('deletes old blobs and reports them when authorized', async () => {
    mockDelete.mockResolvedValueOnce([
      'https://blob/feed/2026-03-01.json',
      'https://blob/feed/2026-03-02.json',
    ]);

    const res = await GET(request('Bearer top-secret'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.deleted).toBe(2);
    expect(body.paths).toHaveLength(2);
  });

  it('returns 500 when deletion throws', async () => {
    mockDelete.mockRejectedValueOnce(new Error('blob error'));

    const res = await GET(request('Bearer top-secret'));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Internal server error' });
  });
});
