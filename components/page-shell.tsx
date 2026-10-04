import type { ReactNode } from 'react';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';
import type { SiteCopy } from '@/lib/site-content';

export function PageShell({
  locale,
  copy,
  children,
  bottomBar
}: {
  locale: 'en' | 'ar';
  copy: SiteCopy;
  children: ReactNode;
  /**
   * A bar fixed to the bottom of phone screens (hidden from lg up). The page
   * gets matching room at the bottom so the bar never covers the footer.
   */
  bottomBar?: ReactNode;
}) {
  const isRtl = locale === 'ar';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#231F20] text-white ${isRtl ? 'font-arabic' : ''} ${
        bottomBar ? 'pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0' : ''
      }`}
    >
      <SiteHeader copy={copy} locale={locale} isRtl={isRtl} />
      <main>{children}</main>
      <SiteFooter copy={copy} locale={locale} />
      {bottomBar}
    </div>
  );
}
