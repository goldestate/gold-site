import type { Metadata } from 'next';
import { getSiteCopy } from '@/lib/site-content';
import { type Locale } from '@/i18n/routing';
import { LandingPage } from '@/components/landing-page';

export function generateStaticParams() {
  return ['en', 'ar'].map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const { locale } = params;
  const copy = getSiteCopy(locale);

  return {
    title: copy.seo.title,
    description: copy.seo.description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: '/en',
        ar: '/ar'
      }
    },
    openGraph: {
      title: copy.seo.title,
      description: copy.seo.description,
      url: `/${locale}`,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: copy.seo.title
        }
      ]
    }
  };
}

export default async function LocalePage({
  params
}: {
  params: { locale: Locale };
}) {
  const { locale } = params;
  const copy = getSiteCopy(locale);

  return <LandingPage locale={locale} copy={copy} />;
}
