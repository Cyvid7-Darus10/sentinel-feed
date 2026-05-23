import { describe, it, expect } from 'vitest';
import { isCritical } from '../classification';
import type { Story } from '../types';

function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 'test-1',
    source: 'hackernews',
    title: 'Some normal story',
    url: 'https://example.com',
    score: 100,
    author: 'test',
    description: null,
    tags: [],
    summary: null,
    relevant: true,
    fetchedAt: new Date().toISOString(),
    publishedAt: null,
    ...overrides,
  };
}

describe('isCritical', () => {
  describe('original patterns', () => {
    it.each([
      ['CVE-2026-12345 discovered in OpenSSL', 'CVE identifier'],
      ['Critical vulnerability in Linux kernel', 'vulnerability keyword'],
      ['New zero-day exploit targets Chrome', 'zero-day'],
      ['Exploit released for Log4j flaw', 'exploit keyword'],
      ['Major data breach at company X', 'breach keyword'],
      ['Ransomware attack hits hospitals', 'ransomware'],
      ['Backdoor found in npm package', 'backdoor'],
      ['RCE flaw in popular framework', 'RCE abbreviation'],
      ['Remote code execution in Windows', 'remote code execution'],
      ['Critical patch released for Apache', 'critical patch'],
      ['Critical bug in OpenSSH', 'critical bug'],
      ['Supply chain attack on PyPI', 'supply chain attack'],
    ])('flags: %s (%s)', (title) => {
      expect(isCritical(makeStory({ title }))).toBe(true);
    });
  });

  describe('expanded patterns', () => {
    it.each([
      ['Privilege escalation in sudo', 'privilege escalation'],
      ['Authentication bypass in OAuth library', 'auth bypass'],
      ['SQL injection in WordPress plugin', 'SQL injection'],
      ['XSS vulnerability in React component', 'XSS'],
      ['Cross-site scripting in email client', 'cross-site scripting'],
      ['SSRF flaw allows internal network access', 'SSRF'],
      ['Code injection via template engine', 'code injection'],
      ['Path traversal in file upload', 'path traversal'],
      ['Directory traversal allows reading /etc/passwd', 'directory traversal'],
      ['Data leak exposes 10M records', 'data leak'],
      ['Data exfiltration via DNS tunneling', 'data exfiltration'],
      ['Phishing campaign targets developers', 'phishing'],
      ['Malware distributed through npm', 'malware'],
      ['Trojan disguised as VS Code extension', 'trojan'],
      ['Rootkit persists across reboots', 'rootkit'],
      ['Botnet leverages IoT devices', 'botnet'],
      ['DDoS attack takes down service', 'DDoS'],
      ['Denial of service via regex', 'denial of service'],
      ['Man-in-the-middle attack on TLS', 'MITM'],
      ['MITM vulnerability in VPN client', 'MITM abbreviation'],
      ['Credential stuffing hits major bank', 'credential stuffing'],
      ['Credential dump posted online', 'credential dump'],
      ['Session hijacking via cookie theft', 'session hijacking'],
      ['Buffer overflow in C library', 'buffer overflow'],
      ['Heap overflow in image parser', 'heap overflow'],
      ['Use-after-free in browser engine', 'use-after-free'],
      ['Out of bounds read in kernel', 'out of bounds'],
      ['Arbitrary code execution via PDF', 'arbitrary code'],
      ['Security advisory for Node.js', 'security advisory'],
      ['Microsoft Patch Tuesday fixes 60 flaws', 'Patch Tuesday'],
      ['Actively exploited flaw in Cisco routers', 'actively exploited'],
      ['Supply chain compromise of GitHub Action', 'supply chain compromise'],
      ['Critical vuln in OpenSSL 3.x', 'critical vuln'],
      ['Security incident at cloud provider', 'security incident'],
    ])('flags: %s (%s)', (title) => {
      expect(isCritical(makeStory({ title }))).toBe(true);
    });
  });

  describe('matches in summary and description', () => {
    it('flags critical keyword in summary', () => {
      expect(
        isCritical(makeStory({ title: 'Update released', summary: 'Fixes a critical vulnerability' })),
      ).toBe(true);
    });

    it('flags critical keyword in description', () => {
      expect(
        isCritical(makeStory({ title: 'New patch', description: 'Addresses CVE-2026-9999' })),
      ).toBe(true);
    });
  });

  describe('non-critical stories', () => {
    it.each([
      ['New JavaScript framework released'],
      ['How to build a REST API in Go'],
      ['React 20 is now available'],
      ['GitHub introduces new code review features'],
      ['Best practices for Kubernetes deployment'],
      ['Understanding async/await in Python'],
      ['TailwindCSS v5 migration guide'],
      ['Building a CLI tool in Rust'],
    ])('does not flag: %s', (title) => {
      expect(isCritical(makeStory({ title }))).toBe(false);
    });
  });
});
