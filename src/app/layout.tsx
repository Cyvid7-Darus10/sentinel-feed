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
    default: 'Sentinel Feed — Tech Intelligence Radar',
    template: '%s | Sentinel Feed',
  },
  description:
    'AI-curated tech news radar. Stories from Hacker News, GitHub Trending, Lobsters, Dev.to, daily.dev, Techmeme, and InfoQ — filtered, summarized, and categorized in real time. Stay current in 5 minutes.',
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
    title: 'Sentinel Feed — Tech Intelligence Radar',
    description:
      'AI-curated tech news radar. Stories from Hacker News, GitHub Trending, Lobsters, Dev.to, daily.dev, Techmeme, and InfoQ — filtered and summarized in real time.',
    images: [
      {
        url: '/og-image.png',
        width: 2400,
        height: 1260,
        alt: 'Sentinel Feed — AI-curated tech intelligence radar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sentinel Feed — Tech Intelligence Radar',
    description:
      'AI-curated tech news from HN, GitHub Trending, Lobsters, Dev.to, daily.dev, Techmeme, and InfoQ. Stay current in 5 minutes.',
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
