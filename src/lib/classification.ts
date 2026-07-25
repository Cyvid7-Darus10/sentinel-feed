import type { Story } from './types';

// Deliberately a regex and not a model call. The cost is zero, the latency is zero,
// and the answer is the same every time, which matters more here than nuance: a
// summarizer that occasionally decides a CVE isn't newsworthy is worse than a pattern
// that occasionally over-flags. `.?` between words absorbs the hyphen/space/nothing
// variants ("zero-day", "zero day", "zeroday") that these terms get written in.
//
// Tuned to over-flag rather than miss. A false positive costs one red dot; a false
// negative buries an actively exploited RCE under trending repos.
const CRITICAL_PATTERN =
  /cve[-\s]?\d|vulnerab|exploit|zero.?day|breach|ransomware|backdoor|rce\b|remote.?code|critical.?(flaw|bug|patch|update|vuln)|supply.?chain.?(attack|compromise)|privilege.?escalat|auth(entication)?.?bypass|sql.?inject|xss\b|cross.?site|ssrf\b|code.?inject|path.?travers|directory.?travers|data.?(leak|exfiltrat)|phishing|malware|trojan|rootkit|botnet|ddos|denial.?of.?service|man.?in.?the.?middle|mitm\b|credential.?(stuff|dump|leak)|session.?hijack|buffer.?overflow|heap.?overflow|use.?after.?free|out.?of.?bounds|arbitrary.?code|security.?(advisory|bulletin|incident|emergency)|patch.?tuesday|actively.?exploit/i;

export function isCritical(story: Story): boolean {
  const text = `${story.title} ${story.summary ?? ''} ${story.description ?? ''}`;
  return CRITICAL_PATTERN.test(text);
}
