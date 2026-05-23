import type { Story } from './types';

const CRITICAL_PATTERN =
  /cve[-\s]?\d|vulnerab|exploit|zero.?day|breach|ransomware|backdoor|rce\b|remote.?code|critical.?(flaw|bug|patch|update|vuln)|supply.?chain.?(attack|compromise)|privilege.?escalat|auth(entication)?.?bypass|sql.?inject|xss\b|cross.?site|ssrf\b|code.?inject|path.?travers|directory.?travers|data.?(leak|exfiltrat)|phishing|malware|trojan|rootkit|botnet|ddos|denial.?of.?service|man.?in.?the.?middle|mitm\b|credential.?(stuff|dump|leak)|session.?hijack|buffer.?overflow|heap.?overflow|use.?after.?free|out.?of.?bounds|arbitrary.?code|security.?(advisory|bulletin|incident|emergency)|patch.?tuesday|actively.?exploit/i;

export function isCritical(story: Story): boolean {
  const text = `${story.title} ${story.summary ?? ''} ${story.description ?? ''}`;
  return CRITICAL_PATTERN.test(text);
}
