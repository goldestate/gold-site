import type { MetadataRoute } from 'next';
import { readPublishedProperties } from '@/lib/properties-store';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://gold-eg.com';
const LOCALES = ['en', 'ar'] as const;
const STATIC_PATHS = ['', '/properties', '/about', '/contact'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await readPublishedProperties();
  const lastModified = new Date();

  const staticEntries = LOCALES.flatMap((locale) =>
    STATIC_PATHS.map((path) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified
    }))
  );

  const propertyEntries = LOCALES.flatMap((locale) =>
    properties.map((property) => ({
      url: `${BASE_URL}/${locale}/properties/${property.id}`,
      lastModified: new Date(property.createdAt)
    }))
  );

  return [...staticEntries, ...propertyEntries];
}
