import { TacticalMap } from '@/components/templates/tactical-map';
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
      'Seven developer news sources on one radar. Hacker News, GitHub Trending, Lobsters, Dev.to, daily.dev, Techmeme, and InfoQ, deduplicated and sorted by topic every 15 minutes.',
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
