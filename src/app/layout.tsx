import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SITE_URL } from '@/lib/config';

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

const siteUrl = SITE_URL;

export const viewport: Viewport = {
  themeColor: '#0a0a0c',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'Sentinel Feed: Tech Intelligence Radar',
    template: '%s | Sentinel Feed',
  },
  description:
    'Seven developer news sources on one radar. Hacker News, GitHub Trending, Lobsters, Dev.to, daily.dev, Techmeme, and InfoQ, deduplicated and sorted by topic every 15 minutes, with AI summaries and security alerts.',
  keywords: [
    'tech news',
    'hacker news',
    'github trending',
    'developer news',
    'AI news aggregator',
    'security alerts',
    'programming news',
    'dev.to',
    'lobsters',
    'daily.dev',
    'techmeme',
    'infoq',
  ],
  authors: [{ name: 'Sentinel Feed' }],
  creator: 'Sentinel Feed',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Sentinel Feed',
    title: 'Sentinel Feed: Tech Intelligence Radar',
    description:
      'Seven developer news sources on one radar, refreshed every 15 minutes. Hacker News, GitHub Trending, Lobsters, Dev.to, daily.dev, Techmeme, and InfoQ, deduplicated and summarized.',
    images: [
      {
        url: '/og-image.png',
        width: 2400,
        height: 1260,
        alt: 'The Sentinel Feed radar dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sentinel Feed: Tech Intelligence Radar',
    description:
      'Seven dev news sources on one radar: HN, GitHub Trending, Lobsters, Dev.to, daily.dev, Techmeme, InfoQ. Deduplicated, ranked, summarized.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full`}>
      <body className="h-full font-mono">{children}</body>
    </html>
  );
}
