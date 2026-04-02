import { TacticalMap } from '@/components/tactical-map';
import { readStoriesForDays, readSourceHealth } from '@/lib/storage';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

const siteUrl = SITE_URL;

function JsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Sentinel Feed',
    url: siteUrl,
    description:
      'AI-curated tech news radar. Stories from Hacker News, GitHub Trending, Lobsters, Dev.to, daily.dev, Techmeme, and InfoQ — filtered, summarized, and categorized in real time.',
    applicationCategory: 'NewsApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default async function Home() {
  const [stories, health] = await Promise.all([
    readStoriesForDays(1),
    readSourceHealth(),
  ]);

  return (
    <>
      <JsonLd />
      <TacticalMap initialStories={stories} initialHealth={health} />
    </>
  );
}
