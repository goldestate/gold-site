import { Link } from '@/i18n/navigation';
import { BrandLogo } from './brand-logo';
import { GMark } from './gmark';
import { AppDownloadCard } from './app-download-card';
import type { SiteCopy } from '@/lib/site-content';

type SiteFooterProps = {
  copy: SiteCopy;
  locale: 'en' | 'ar';
};

/**
 * Laid out once, in logical order. The page is dir="rtl" in Arabic, so rows and
 * text mirror on their own; reversing them by hand as well (as this footer used
 * to) mirrored them back, which put the links in reverse reading order.
 */
export function SiteFooter({ copy, locale }: SiteFooterProps) {
  const isRtl = locale === 'ar';

  const navItems = [
    { label: copy.nav.home, href: '/' },
    { label: copy.nav.properties, href: '/properties' },
    { label: copy.nav.about, href: '/about' },
    { label: copy.nav.contact, href: '/contact' }
  ];

  return (
    <footer className="clip-overflow relative border-t border-white/10 bg-[#171314] px-4 py-10 sm:px-6 lg:px-8">
      <GMark tone="gold" size={520} className="-bottom-28 -end-28 opacity-[0.045]" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-lg">
            <BrandLogo />
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/68">{copy.footer.tagline}</p>
            <AppDownloadCard copy={copy.footer.app} locale={locale} />
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                locale={locale}
                className={`text-sm text-white/72 transition hover:text-[#D9B355] ${isRtl ? '' : 'tracking-[0.18em]'}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/58 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p>{copy.footer.legal}</p>
              <Link href="/privacy" className="transition hover:text-[#D9B355]">
                {isRtl ? 'الخصوصية' : 'Privacy'}
              </Link>
            </div>
            <p className="mt-2 max-w-2xl text-[11px] leading-5 text-white/40">{copy.footer.appleCredit}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              locale="en"
              className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.24em] ${
                locale === 'en' ? 'btn-gold' : 'border border-white/15 text-white/75'
              }`}
            >
              EN
            </Link>
            <Link
              href="/"
              locale="ar"
              className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.24em] ${
                locale === 'ar' ? 'btn-gold' : 'border border-white/15 text-white/75'
              }`}
            >
              عربي
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
