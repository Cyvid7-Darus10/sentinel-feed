import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-[13px] leading-relaxed">
      <h1 className="mb-8 text-[20px] font-bold text-text-bright">Privacy Policy</h1>
      <p className="mb-4 text-text-muted">Last updated: April 2, 2026</p>

      <Section title="Overview">
        <p>
          Sentinel Feed (&quot;the Service&quot;) and Sentinel Bar (&quot;the App&quot;) are operated by
          Cyrus Pastelero. This policy explains what data we collect, how we use it, and your rights.
        </p>
        <p className="mt-2 font-semibold text-text-bright">
          We do not collect, store, or share any personal information.
        </p>
      </Section>

      <Section title="Data We Collect">
        <p>The web dashboard and macOS app do not require accounts, logins, or registration. We collect:</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-text-secondary">
          <li><strong className="text-text-bright">No personal data</strong> — no names, emails, or identifiers</li>
          <li><strong className="text-text-bright">No analytics or tracking</strong> — no cookies, no third-party trackers, no fingerprinting</li>
          <li><strong className="text-text-bright">No usage data</strong> — we do not track which stories you read or click</li>
        </ul>
      </Section>

      <Section title="Data the App Stores Locally">
        <p>Sentinel Bar (the macOS app) stores the following on your device only:</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-text-secondary">
          <li>Cached story data from the public API (refreshed every 5 minutes)</li>
          <li>A set of story IDs for which notifications have already been sent (to avoid duplicates)</li>
          <li>Your notification permission preference</li>
        </ul>
        <p className="mt-2">This data never leaves your device and is not transmitted to us or any third party.</p>
      </Section>

      <Section title="Third-Party Services">
        <p>The Service aggregates publicly available content from third-party sources:</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-text-secondary">
          <li>Hacker News (news.ycombinator.com)</li>
          <li>GitHub Trending (github.com)</li>
          <li>Lobsters (lobste.rs)</li>
          <li>Dev.to (dev.to)</li>
          <li>daily.dev (daily.dev)</li>
          <li>Techmeme (techmeme.com)</li>
          <li>InfoQ (infoq.com)</li>
        </ul>
        <p className="mt-2">
          When you click a story link, you are directed to the original source. That site&apos;s own
          privacy policy applies from that point.
        </p>
      </Section>

      <Section title="AI Processing">
        <p>
          Stories may be processed by Claude (Anthropic) to generate one-line summaries and relevance
          scores. Only story titles and descriptions are sent — no user data is included. Anthropic&apos;s
          API does not retain inputs for training.
        </p>
      </Section>

      <Section title="Hosting">
        <p>
          The web dashboard is hosted on Vercel. Vercel may collect standard server access logs
          (IP addresses, request timestamps) as part of infrastructure operations. See{' '}
          <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-success hover:underline">
            Vercel&apos;s Privacy Policy
          </a>{' '}
          for details.
        </p>
      </Section>

      <Section title="Children">
        <p>
          The Service is not directed at children under 13. We do not knowingly collect
          information from children.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update this policy from time to time. Changes will be posted on this page
          with an updated date.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about this policy? Open an issue on{' '}
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
