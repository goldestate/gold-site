import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getLocale } from 'next-intl/server';
import { Montserrat, Libre_Baskerville, Tajawal } from 'next/font/google';
import './globals.css';

// Avenir Next and Baskerville (per the brand guideline) are commercial typefaces
// not available as web fonts. Montserrat and Libre Baskerville are the closest
// freely-licensed matches for the same "modern geometric sans + classic serif"
// pairing, loaded here so text renders consistently instead of silently falling
// back to whatever happens to be installed on the visitor's device.
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans'
});

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-serif'
});

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-arabic'
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
      className={`${montserrat.variable} ${libreBaskerville.variable} ${tajawal.variable}`}
      suppressHydrationWarning
    >
      <body
        className={`bg-[#231F20] text-white antialiased ${isRtl ? 'font-arabic' : 'font-sans'}`}
      >
        {children}
      </body>
    </html>
  );
}
