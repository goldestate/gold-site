import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/goldenadmin2026', '/api']
    },
    sitemap: 'https://gold-eg.com/sitemap.xml'
  };
}
