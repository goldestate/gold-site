import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Unlock links are private, one-to-one, and carry a working code.
      disallow: ['/goldenadmin2026', '/api', '/unlock', '/en/unlock', '/ar/unlock']
    },
    sitemap: 'https://gold-eg.com/sitemap.xml'
  };
}
