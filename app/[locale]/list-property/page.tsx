import type { Metadata } from 'next';
import { getSiteCopy } from '@/lib/site-content';
import { type Locale } from '@/i18n/routing';
import { PageShell } from '@/components/page-shell';
import { ListPropertySection } from '@/components/list-property-section';

export async function generateMetadata({
  params
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const copy = getSiteCopy(params.locale);
  return {
    title: `${copy.listPropertyPage.title} — ${copy.seo.title}`,
    description: copy.listPropertyPage.intro
  };
}

export default function ListPropertyPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  const copy = getSiteCopy(locale);

  return (
    <PageShell locale={locale} copy={copy}>
      <ListPropertySection copy={copy.listPropertyPage} locale={locale} isRtl={locale === 'ar'} />
    </PageShell>
  );
}
