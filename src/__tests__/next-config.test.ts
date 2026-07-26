import { describe, it, expect } from 'vitest';
import nextConfig from '../../next.config';

async function getHeaderRules() {
  if (!nextConfig.headers) throw new Error('headers() not configured');
  return nextConfig.headers();
}

function ruleFor(rules: Awaited<ReturnType<typeof getHeaderRules>>, source: string) {
  const rule = rules.find((r) => r.source === source);
  if (!rule) throw new Error(`no header rule for ${source}`);
  return new Map(rule.headers.map((h) => [h.key, h.value]));
}

describe('next.config security headers', () => {
  it('denies framing and sets hardening headers on non-embed routes', async () => {
    const headers = ruleFor(await getHeaderRules(), '/((?!embed).*)');
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('Permissions-Policy')).toContain('camera=()');
  });

  it('keeps /embed frameable while still hardening MIME and referrer', async () => {
    const headers = ruleFor(await getHeaderRules(), '/embed/:path*');
    expect(headers.has('X-Frame-Options')).toBe(false);
    expect(headers.has('Content-Security-Policy')).toBe(false);
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });
});
