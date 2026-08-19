import type { Metadata } from 'next';
import { getSiteCopy } from '@/lib/site-content';
import { readPublishedProperties } from '@/lib/properties-store';
import { type Locale } from '@/i18n/routing';
import { PageShell } from '@/components/page-shell';
import { HeroSearch, TrustStrip, FeaturedProperties, HomePartners, RentalDeskPromo, ContactCta } from '@/components/home-sections';

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

export function generateStaticParams() {
  return ['en', 'ar'].map((locale) => ({ locale }));
}

export default async function HomePage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  const copy = getSiteCopy(locale);
  const properties = await readPublishedProperties();
  const featured = properties.slice(0, 3);
  const isRtl = locale === 'ar';

  return (
    <PageShell locale={locale} copy={copy}>
      <HeroSearch copy={copy.home.hero} locale={locale} isRtl={isRtl} />
      <HomePartners copy={copy.home.partners} isRtl={isRtl} />
      {featured.length > 0 ? (
        <FeaturedProperties copy={copy.home.featured} properties={featured} locale={locale} isRtl={isRtl} />
      ) : null}
      <TrustStrip copy={copy.home.trust} isRtl={isRtl} />
      <RentalDeskPromo copy={copy.home.rentalDesk} locale={locale} isRtl={isRtl} />
      <ContactCta copy={copy.home.contactCta} locale={locale} isRtl={isRtl} />
    </PageShell>
  );
}

export const dynamic = 'force-dynamic';
