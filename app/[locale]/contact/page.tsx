import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getSiteCopy } from '@/lib/site-content';
import { type Locale } from '@/i18n/routing';
import { PageShell } from '@/components/page-shell';
import { ContactSection } from '@/components/contact-section';

export async function generateMetadata({
  params
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const copy = getSiteCopy(params.locale);
  return {
    title: `${copy.contact.title} — ${copy.seo.title}`,
    description: copy.contact.intro
  };
}

export default function ContactPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  const copy = getSiteCopy(locale);

  return (
    <PageShell locale={locale} copy={copy}>
      <Suspense fallback={null}>
        <ContactSection copy={copy.contact} locale={locale} isRtl={locale === 'ar'} />
      </Suspense>
    </PageShell>
  );
}
