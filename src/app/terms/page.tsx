import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-[13px] leading-relaxed">
      <h1 className="mb-8 text-[20px] font-bold text-text-bright">Terms of Service</h1>
      <p className="mb-4 text-text-muted">Last updated: April 2, 2026</p>

      <Section title="Agreement">
        <p>
          By using Sentinel Feed (&quot;the Service&quot;) or Sentinel Bar (&quot;the App&quot;),
          you agree to these terms. If you do not agree, do not use the Service or App.
        </p>
      </Section>

      <Section title="Description of Service">
        <p>
          Sentinel Feed is a free, open-source tech news aggregator that collects publicly
          available content from third-party sources (Hacker News, GitHub, Lobsters, Dev.to,
          daily.dev, Techmeme, InfoQ), categorizes it by topic, and optionally enriches it
          with AI-generated summaries.
        </p>
        <p className="mt-2">
          Sentinel Bar is a companion macOS menu bar application that displays this aggregated
          feed natively on your desktop.
        </p>
      </Section>

      <Section title="Content">
        <p>
          All news content displayed by the Service originates from third-party sources. We do
          not create, endorse, or guarantee the accuracy of any story, title, or summary. AI-generated
          summaries are provided for convenience and may not perfectly represent the original content.
        </p>
        <p className="mt-2">
          Story links direct you to the original source. Your interaction with those sites is
          governed by their respective terms.
        </p>
      </Section>

      <Section title="Acceptable Use">
        <p>You agree not to:</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-text-secondary">
          <li>Disrupt or interfere with the Service&apos;s infrastructure</li>
          <li>Attempt to bypass rate limits or authentication on API endpoints</li>
          <li>Use the Service to redistribute content in a way that violates the original sources&apos; terms</li>
          <li>Misrepresent AI-generated summaries as original reporting</li>
        </ul>
      </Section>

      <Section title="API Usage">
        <p>
          The public API (<code className="text-text-bright">/api/stories</code>) is available for
          personal and non-commercial use. Excessive automated requests may be throttled. For
          commercial use, please contact us first.
        </p>
      </Section>

      <Section title="Availability">
        <p>
          The Service is provided on an &quot;as-is&quot; basis. We do not guarantee uninterrupted
          availability, data freshness, or completeness of coverage. Sources may be added or
          removed at any time. The Service may be discontinued with reasonable notice.
        </p>
      </Section>

      <Section title="Intellectual Property">
        <p>
          The Sentinel Feed source code is licensed under{' '}
          <a href="https://github.com/Cyvid7-Darus10/sentinel-feed/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-success hover:underline">
            Apache License 2.0
          </a>.
          The Sentinel Bar macOS application is proprietary software.
        </p>
        <p className="mt-2">
          News content belongs to its original authors and publishers. The Service displays
          titles, summaries, and metadata under fair use for aggregation purposes.
        </p>
      </Section>

      <Section title="Disclaimer of Warranties">
        <p>
          THE SERVICE AND APP ARE PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND, EXPRESS
          OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
        </p>
      </Section>

      <Section title="Limitation of Liability">
        <p>
          IN NO EVENT SHALL THE OPERATOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE OR APP.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update these terms from time to time. Continued use of the Service after
          changes constitutes acceptance. Material changes will be posted on this page with
          an updated date.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms? Open an issue on{' '}
          <a href="https://github.com/Cyvid7-Darus10/sentinel-feed" target="_blank" rel="noopener noreferrer" className="text-success hover:underline">
            GitHub
          </a>.
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[15px] font-semibold text-text-bright">{title}</h2>
      <div className="text-text-secondary">{children}</div>
    </section>
  );
}
