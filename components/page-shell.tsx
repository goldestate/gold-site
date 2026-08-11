import type { ReactNode } from 'react';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';
import type { SiteCopy } from '@/lib/site-content';

export function PageShell({
  locale,
  copy,
  children
}: {
  locale: 'en' | 'ar';
  copy: SiteCopy;
  children: ReactNode;
}) {
  const isRtl = locale === 'ar';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#231F20] text-white ${isRtl ? 'font-arabic' : ''}`}
    >
      <SiteHeader copy={copy} locale={locale} isRtl={isRtl} />
      <main>{children}</main>
      <SiteFooter copy={copy} locale={locale} />
    </div>
  );
}
