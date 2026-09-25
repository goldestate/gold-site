import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { routing, type Locale } from '@/i18n/routing';
import { OG_LOCALE, SHARE_IMAGE, getSiteCopy } from '@/lib/site-content';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Link-preview defaults in the page's own language.
 *
 * The images are set HERE, not only in the root layout, because Next attaches
 * app/opengraph-image.tsx to this segment as well, and a file-based image wins
 * over any level that does not name its own. Without these two lines every page
 * that sets no image of its own previews with /opengraph-image, which the locale
 * middleware redirects to a 404.
 *
 * og:title and og:description are left out on purpose: Next fills them from each
 * page's own title and description, which is what a shared link should say.
 */
export async function generateMetadata({
  params
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = routing.locales.includes(params.locale as Locale)
    ? (params.locale as Locale)
    : routing.defaultLocale;
  const { seo } = getSiteCopy(locale);

  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      type: 'website',
      siteName: seo.title,
      locale: OG_LOCALE[locale],
      images: [{ ...SHARE_IMAGE, alt: seo.title }]
    },
    twitter: {
      card: 'summary',
      images: [SHARE_IMAGE.url]
    }
  };
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: ReactNode;
  params: { locale: string };
}>) {
  const { locale } = params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>{children}</div>
    </NextIntlClientProvider>
  );
}
