import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'No signal',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-[11px] uppercase tracking-[0.08em] text-text-muted">
        404
      </p>
      <h1 className="text-[20px] font-bold text-text-bright">No signal here</h1>
      <p className="max-w-md text-[13px] leading-relaxed text-text-secondary">
        That route is not part of the dashboard.
      </p>
      <Link
        href="/"
        className="mt-2 border border-border px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-text-primary transition-colors duration-[120ms] hover:bg-bg-hover hover:text-text-bright"
      >
        Back to the radar
      </Link>
    </main>
  );
}
