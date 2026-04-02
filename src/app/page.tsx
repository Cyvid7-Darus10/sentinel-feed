import { TacticalMap } from '@/components/tactical-map';
import { readStoriesForDays, readSourceHealth } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sentinel-feed.pastelero.ph';

function JsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Sentinel Feed',
    url: siteUrl,
    description:
      'AI-curated tech news radar. Stories from Hacker News, GitHub Trending, Lobsters, Dev.to, and Reddit — filtered, summarized, and categorized in real time.',
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
