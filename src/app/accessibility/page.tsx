import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility',
};

export default function AccessibilityPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-[13px] leading-relaxed">
      <h1 className="mb-8 text-[20px] font-bold text-text-bright">Accessibility</h1>
      <p className="mb-4 text-text-muted">Last updated: April 2, 2026</p>

      <Section title="Where we are">
        <p>
          Sentinel Bar is built with SwiftUI, so it inherits most of what macOS provides for
          accessibility. Below is what that covers today. If something on this page does not
          match your experience of the app, that is a bug and we would like to hear about it.
        </p>
      </Section>

      <Section title="What works">
        <ul className="mt-2 list-inside list-disc space-y-2 text-text-secondary">
          <li>
            VoiceOver reads every story title, summary, source badge, score, and navigation
            control. Labeling and focus order come from standard SwiftUI components.
          </li>
          <li>
            Voice Control can activate every interactive element, including story rows, tabs,
            and buttons.
          </li>
          <li>
            Tab and the standard macOS keyboard shortcuts move through the popover and
            everything inside it.
          </li>
          <li>
            Text runs bright white (#EAEAF0) on near-black (#0A0A0C), which clears WCAG AA
            contrast ratios.
          </li>
          <li>
            The native feed tab has no animation at all. The embedded dashboard tab does have
            some, including the radar sweep, and those honor the system Reduce Motion setting.
          </li>
          <li>
            The interface is dark only. There is no light theme.
          </li>
        </ul>
      </Section>

      <Section title="Color">
        <p>
          Topic categories and source badges are color-coded, but color is never the only signal.
          Every colored element also carries a text label, such as &quot;HN&quot;, &quot;GH&quot;,
          or &quot;SECURITY&quot;.
        </p>
      </Section>

      <Section title="Feedback">
        <p>
          If you encounter accessibility barriers or have suggestions for improvement, please
          open an issue on{' '}
          <a
            href="https://github.com/Cyvid7-Darus10/sentinel-feed/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-success hover:underline"
          >
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
