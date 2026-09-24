import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Jost, Libre_Baskerville, Tajawal } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import { SHARE_IMAGE, SITE_URL, siteCopy } from '@/lib/site-content';
import './globals.css';

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap'
});

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap'
});

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-arabic',
  display: 'swap'
});

/**
 * Site-wide defaults. Pages under /[locale] get localized versions of these from
 * app/[locale]/layout.tsx. The images below do not reach every page: while
 * app/opengraph-image.tsx exists, Next's file convention overrides them at this
 * level, so a page that does not name its own images (the admin) gets that
 * file's /opengraph-image URL, which the locale middleware redirects to a 404.
 * Harmless there, since admin links are never shared.
 *
 * metadataBase is what relative image and page URLs in link previews resolve
 * against. It pointed at a placeholder .example domain, so every preview image
 * on the site -- including the one WhatsApp shows under a guest's unlock link --
 * was a URL that does not exist.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // No title template: every page already writes its full title, brand
  // included ("About — GOLD Investment Opportunities"), and a suffix here
  // printed the brand twice.
  title: siteCopy.en.seo.title,
  description: siteCopy.en.seo.description,
  openGraph: {
    type: 'website',
    siteName: siteCopy.en.seo.title,
    images: [{ ...SHARE_IMAGE, alt: 'GOLD' }]
  },
  twitter: {
    // A square image, so the small card; the large one would crop it.
    card: 'summary',
    images: [SHARE_IMAGE.url]
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const locale = await getLocale();
  const isRtl = locale === 'ar';

  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      suppressHydrationWarning
      className={`${jost.variable} ${libreBaskerville.variable} ${tajawal.variable}`}
    >
      <body className="bg-[#231F20] font-sans text-white antialiased">{children}</body>
    </html>
  );
}
