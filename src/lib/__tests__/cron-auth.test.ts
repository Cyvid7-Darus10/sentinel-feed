import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { verifyCronAuth } from '../cron-auth';

const ORIGINAL_SECRET = process.env.CRON_SECRET;

function request(authHeader?: string): NextRequest {
  return new NextRequest('http://localhost/api/fetch', {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe('verifyCronAuth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Silence the route's console diagnostics during expected-failure cases.
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (ORIGINAL_SECRET === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = ORIGINAL_SECRET;
    }
  });

  it('returns 500 when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;

    const res = verifyCronAuth(request('Bearer anything'));

    expect(res).not.toBeNull();
    expect(res!.status).toBe(500);
    expect(await res!.json()).toEqual({ error: 'Server misconfigured' });
  });

  it('returns 401 when the Authorization header is missing', async () => {
    process.env.CRON_SECRET = 'top-secret';

    const res = verifyCronAuth(request());

    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
    expect(await res!.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when the bearer token does not match', async () => {
    process.env.CRON_SECRET = 'top-secret';

    const res = verifyCronAuth(request('Bearer wrong'));

    expect(res!.status).toBe(401);
  });

  it('returns null (auth passes) when the bearer token matches', () => {
    process.env.CRON_SECRET = 'top-secret';

    const res = verifyCronAuth(request('Bearer top-secret'));

    expect(res).toBeNull();
  });
});
