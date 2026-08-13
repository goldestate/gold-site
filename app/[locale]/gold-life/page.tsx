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
    title: `${copy.subbrandPages.goldLife.title} — ${copy.seo.title}`,
    description: copy.subbrandPages.goldLife.body
  };
}

export default function GoldLifePage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  const copy = getSiteCopy(locale);
  const isRtl = locale === 'ar';
  const page = copy.subbrandPages.goldLife;

  return (
    <PageShell locale={locale} copy={copy}>
      <SubbrandHero
        eyebrow={page.eyebrow}
        title={page.title}
        body={page.body}
        icon="life"
        isRtl={isRtl}
        locale={locale}
        backLabel={copy.subbrandPages.backLabel}
        ctaLabel={page.ctaLabel}
        services={{ label: page.servicesLabel, items: page.services }}
        partners={{ label: page.partnersLabel, items: page.partners }}
      />
    </PageShell>
  );
}
