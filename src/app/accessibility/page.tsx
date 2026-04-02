import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility',
};

export default function AccessibilityPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-[13px] leading-relaxed">
      <h1 className="mb-8 text-[20px] font-bold text-text-bright">Accessibility</h1>
      <p className="mb-4 text-text-muted">Last updated: April 2, 2026</p>

      <Section title="Our Commitment">
        <p>
          Sentinel Bar is built with SwiftUI, which provides built-in support for macOS
          accessibility features. We are committed to making the app usable by everyone.
        </p>
      </Section>

      <Section title="Supported Features">
        <ul className="mt-2 list-inside list-disc space-y-2 text-text-secondary">
          <li>
            <strong className="text-text-bright">VoiceOver</strong> — All story titles, summaries,
            source badges, scores, and navigation elements are accessible to the macOS screen reader.
            Standard SwiftUI components ensure proper labeling and focus order.
          </li>
          <li>
            <strong className="text-text-bright">Voice Control</strong> — All interactive elements
            (story rows, tabs, buttons) can be activated via macOS Voice Control.
          </li>
          <li>
            <strong className="text-text-bright">Dark Interface</strong> — The app uses a dark theme
            exclusively, reducing eye strain in low-light environments.
          </li>
          <li>
            <strong className="text-text-bright">Sufficient Contrast</strong> — Text uses high-contrast
            color pairings: bright white (#EAEAF0) on near-black (#0A0A0C) backgrounds, exceeding
            WCAG AA contrast ratios.
          </li>
          <li>
            <strong className="text-text-bright">Reduced Motion</strong> — The native feed tab uses
            no animations. The embedded dashboard tab contains optional animations (radar sweep)
            that respect the system Reduce Motion preference.
          </li>
          <li>
            <strong className="text-text-bright">Keyboard Navigation</strong> — The popover and all
            interactive elements are navigable via Tab key and standard macOS keyboard shortcuts.
          </li>
        </ul>
      </Section>

      <Section title="Color Coding">
        <p>
          Topic categories and source badges use color as a visual aid, but every colored element
          also includes a text label (e.g., &quot;HN&quot;, &quot;GH&quot;, &quot;SECURITY&quot;),
          ensuring information is not conveyed by color alone.
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
