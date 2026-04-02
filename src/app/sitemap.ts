import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = SITE_URL;

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date('2026-04-02'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date('2026-04-02'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/accessibility`,
      lastModified: new Date('2026-04-02'),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
