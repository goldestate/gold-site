import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

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

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#231F20] font-sans text-white antialiased">{children}</body>
    </html>
  );
}
