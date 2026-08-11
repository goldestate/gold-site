import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getSiteCopy } from '@/lib/site-content';
import { readPublishedProperties } from '@/lib/properties-store';
import { type Locale } from '@/i18n/routing';
import { PageShell } from '@/components/page-shell';
import { PropertiesPageClient } from '@/components/properties-page-client';

export async function generateMetadata({
  params
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const copy = getSiteCopy(params.locale);
  return {
    title: `${copy.propertiesPage.title} — ${copy.seo.title}`,
    description: copy.propertiesPage.intro
  };
}

export default async function PropertiesPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  const copy = getSiteCopy(locale);
  const properties = await readPublishedProperties();

  return (
    <PageShell locale={locale} copy={copy}>
      <Suspense fallback={null}>
        <PropertiesPageClient
          copy={copy.propertiesPage}
          properties={properties}
          locale={locale}
          isRtl={locale === 'ar'}
        />
      </Suspense>
    </PageShell>
  );
}

export const dynamic = 'force-dynamic';
