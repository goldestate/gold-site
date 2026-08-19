import type { Metadata } from 'next';
import { getSiteCopy } from '@/lib/site-content';
import { type Locale } from '@/i18n/routing';
import { PageShell } from '@/components/page-shell';
import { RentalRequestSection } from '@/components/rental-request-section';

export async function generateMetadata({
  params
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const copy = getSiteCopy(params.locale);
  return {
    title: `${copy.rentalRequestPage.title} — ${copy.seo.title}`,
    description: copy.rentalRequestPage.intro
  };
}

export default function RentalRequestPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  const copy = getSiteCopy(locale);

  return (
    <PageShell locale={locale} copy={copy}>
      <RentalRequestSection copy={copy.rentalRequestPage} locale={locale} isRtl={locale === 'ar'} />
    </PageShell>
  );
}
