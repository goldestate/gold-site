import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gold-investment-opportunities.example';

  return [
    {
      url: `${baseUrl}/en`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/ar`,
      lastModified: new Date()
    }
  ];
}
