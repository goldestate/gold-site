import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Unlock links are private, one-to-one, and carry a working code.
      //
      // The admin path is deliberately NOT listed. This file is public, so naming
      // it here only told password guessers where to aim. Its pages carry a
      // noindex/nofollow robots tag instead (app/goldenadmin2026/layout.tsx), and
      // every admin API is under /api, which is disallowed anyway.
      disallow: ['/api', '/unlock', '/en/unlock', '/ar/unlock']
    },
    sitemap: 'https://gold-eg.com/sitemap.xml'
  };
}
