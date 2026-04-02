import type { Story } from './types';

const CRITICAL_PATTERN =
  /cve[-\s]?\d|vulnerab|exploit|zero.?day|breach|ransomware|backdoor|rce\b|remote.?code|critical.?(flaw|bug|patch|update)|supply.?chain.?attack/i;

export function isCritical(story: Story): boolean {
  const text = `${story.title} ${story.summary ?? ''} ${story.description ?? ''}`;
  return CRITICAL_PATTERN.test(text);
}
