'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { BrandLogo } from './brand-logo';
import type { SiteCopy } from '@/lib/site-content';

type SiteHeaderProps = {
  copy: SiteCopy;
  locale: 'en' | 'ar';
  isRtl: boolean;
};

/**
 * The menu is listed once, in reading order; the page's right-to-left direction
 * mirrors it for Arabic. (It used to be reversed by hand as well, which flipped
 * it back, so the Arabic menu read Contact first and Home last.)
 */
export function SiteHeader({ copy, locale }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations('common');

  const navItems = [
    { label: copy.nav.home, href: '/' },
    { label: copy.nav.about, href: '/about' },
    { label: copy.nav.properties, href: '/properties' },
    { label: copy.nav.forBrokers, href: '/rental-request' },
    { label: copy.nav.goldLife, href: '/gold-life' },
    { label: copy.nav.contact, href: '/contact' }
  ];

  const switchLocale = locale === 'en' ? 'ar' : 'en';
  // The current page without its locale ("/unlock/GOLD-AB-CDEF"), so switching
  // language changes the language and nothing else. These links used to go to
  // "/", which on an unlock page threw away the guest's code with the page.
  const currentPath = usePathname();
  const isCurrent = (href: string) =>
    href === '/' ? currentPath === '/' : currentPath === href || currentPath.startsWith(`${href}/`);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-[rgba(23,19,20,0.86)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" locale={locale} aria-label="GOLD home" className="relative z-10">
          <BrandLogo compact />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          <nav aria-label="Primary" className="flex items-center gap-7 text-sm">
            {navItems.map((item) => {
              const current = isCurrent(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  locale={locale}
                  aria-current={current ? 'page' : undefined}
                  className={`relative py-2 tracking-[0.04em] transition after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-center after:bg-[#D9B355] after:transition-transform after:duration-300 ${
                    current
                      ? 'text-[#F4F0E8] after:scale-x-100'
                      : 'text-white/70 after:scale-x-0 hover:text-[#F4F0E8] hover:after:scale-x-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div
            role="group"
            aria-label={t('language')}
            className="flex items-center gap-1 rounded-full bg-white/[0.06] p-1 ring-1 ring-white/10"
          >
            <Link
              href={currentPath}
              locale="en"
              lang="en"
              className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.2em] transition ${
                locale === 'en' ? 'btn-gold' : 'text-white/65 hover:text-white'
              }`}
            >
              {t('english')}
            </Link>
            <Link
              href={currentPath}
              locale="ar"
              lang="ar"
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                locale === 'ar' ? 'btn-gold' : 'text-white/65 hover:text-white'
              }`}
            >
              {t('arabic')}
            </Link>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] text-white ring-1 ring-white/[0.12] transition active:scale-95 lg:hidden"
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span className="sr-only">Open menu</span>
          <span className="flex flex-col gap-1.5">
            <span className={`block h-0.5 w-5 bg-current transition ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-5 bg-current transition ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-current transition ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </span>
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-white/[0.07] bg-[rgba(23,19,20,0.98)] px-4 pb-6 pt-2 backdrop-blur-xl sm:px-6 lg:hidden">
          <nav aria-label="Mobile" className="mx-auto flex max-w-7xl flex-col text-start">
            {navItems.map((item) => {
              const current = isCurrent(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  locale={locale}
                  aria-current={current ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`font-display flex min-h-[52px] items-center justify-between border-b border-white/[0.07] text-[1.35rem] transition ${
                    current ? 'text-[#D9B355]' : 'text-[#F4F0E8] hover:text-[#D9B355]'
                  }`}
                >
                  {item.label}
                  {current ? <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#D9B355]" /> : null}
                </Link>
              );
            })}
            <div className="mt-5 flex">
              <Link
                href={currentPath}
                locale={switchLocale}
                lang={switchLocale}
                className="inline-flex min-h-[44px] items-center rounded-full border border-[rgba(217,179,85,0.35)] px-5 text-sm font-semibold tracking-[0.2em] text-[#D9B355]"
              >
                {switchLocale === 'en' ? t('english') : t('arabic')}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
