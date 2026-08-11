import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Jost, Libre_Baskerville, Tajawal } from 'next/font/google';
import { getLocale } from 'next-intl/server';
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

export const metadata: Metadata = {
  metadataBase: new URL('https://gold-investment-opportunities.example'),
  title: {
    default: 'GOLD Investment Opportunities',
    template: '%s | GOLD Investment Opportunities'
  },
  description:
    'Premium real estate and investment holding brand with bilingual routing, luxury presentation, and future-ready sub-brands.',
  openGraph: {
    type: 'website',
    siteName: 'GOLD Investment Opportunities',
    images: ['/opengraph-image']
  },
  twitter: {
    card: 'summary_large_image'
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
