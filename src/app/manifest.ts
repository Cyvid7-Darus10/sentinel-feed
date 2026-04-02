import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sentinel Feed — Tech Intelligence Radar',
    short_name: 'Sentinel',
    description:
      'AI-curated tech news from Hacker News, GitHub Trending, Lobsters, Dev.to, and daily.dev.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0c',
    theme_color: '#0a0a0c',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
