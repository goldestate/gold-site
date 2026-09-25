import { Link } from '@/i18n/navigation';
import { BrandLogo } from './brand-logo';
import { GMark } from './gmark';
import type { SiteCopy } from '@/lib/site-content';
import { APP_STORE_URL } from '@/lib/app-links';

type SiteFooterProps = {
  copy: SiteCopy;
  locale: 'en' | 'ar';
};

export function SiteFooter({ copy, locale }: SiteFooterProps) {
  const switchLocale = locale === 'en' ? 'ar' : 'en';

  const navItems = [
    { label: copy.nav.home, href: '/' },
    { label: copy.nav.properties, href: '/properties' },
    { label: copy.nav.about, href: '/about' },
    { label: copy.nav.contact, href: '/contact' }
  ];

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#171314] px-4 py-10 sm:px-6 lg:px-8">
      <GMark
        tone="gold"
        size={520}
        className={`-bottom-28 opacity-[0.045] ${locale === 'ar' ? '-left-28' : '-right-28'}`}
      />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-10">
        <div
          className={`flex flex-col gap-8 lg:items-start lg:justify-between ${
            locale === 'ar' ? 'lg:flex-row-reverse text-right' : 'lg:flex-row'
          }`}
        >
          <div className="max-w-md">
            <BrandLogo />
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/68">{copy.footer.tagline}</p>
            {/* Plain text rather than Apple's badge artwork, which comes with its
                own usage rules; the words say where the link goes. */}
            {APP_STORE_URL ? (
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-[44px] items-center rounded-full border border-[rgba(217,179,85,0.45)] px-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#D9B355] transition hover:border-[#D9B355]"
              >
                {copy.footer.getTheApp}
              </a>
            ) : null}
          </div>

          <nav
            aria-label="Footer"
            className={`flex flex-wrap gap-x-8 gap-y-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                locale={locale}
                className="text-sm tracking-[0.18em] text-white/72 transition hover:text-[#D9B355]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div
          className={`flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/58 sm:items-center sm:justify-between ${
            locale === 'ar' ? 'sm:flex-row-reverse text-right' : 'sm:flex-row'
          }`}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p>{copy.footer.legal}</p>
            <Link href="/privacy" className="transition hover:text-[#D9B355]">
              {locale === 'ar' ? 'الخصوصية' : 'Privacy'}
            </Link>
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
