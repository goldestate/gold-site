import type { Metadata } from 'next';
import { getSiteCopy } from '@/lib/site-content';
import { type Locale } from '@/i18n/routing';
import { PageShell } from '@/components/page-shell';
import { SubbrandHero } from '@/components/subbrand-hero';

export async function generateMetadata({
  params
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const copy = getSiteCopy(params.locale);
  return {
    title: `${copy.subbrandPages.goldManagement.title} — ${copy.seo.title}`,
    description: copy.subbrandPages.goldManagement.body
  };
}

export default function GoldManagementPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  const copy = getSiteCopy(locale);
  const isRtl = locale === 'ar';
  const page = copy.subbrandPages.goldManagement;

  return (
    <PageShell locale={locale} copy={copy}>
      <SubbrandHero
        eyebrow={page.eyebrow}
        title={page.title}
        body={page.body}
        icon="management"
        isRtl={isRtl}
        locale={locale}
        backLabel={copy.subbrandPages.backLabel}
        ctaLabel={page.ctaLabel}
      />
    </PageShell>
  );
}
