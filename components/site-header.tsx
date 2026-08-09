'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BrandLogo } from './brand-logo';
import type { SiteCopy } from '@/lib/site-content';

type SiteHeaderProps = {
  copy: SiteCopy;
  locale: 'en' | 'ar';
  isRtl: boolean;
};

export function SiteHeader({ copy, locale, isRtl }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations('common');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: copy.nav.home, href: '#hero' },
    { label: copy.nav.about, href: '#about' },
    { label: copy.nav.usps, href: '#why-gold' },
    { label: copy.nav.properties, href: '#properties' },
    { label: copy.nav.contact, href: '#contact' }
  ];
  const orderedNavItems = isRtl ? [...navItems].reverse() : navItems;

  const switchLocale = locale === 'en' ? 'ar' : 'en';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-white/10 transition-all duration-300 ${
        scrolled
          ? 'bg-[#231F20]/96 shadow-[0_14px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8 ${
          isRtl ? 'flex-row-reverse' : ''
        }`}
      >
        <Link href="/" locale={locale} aria-label="GOLD home" className="relative z-10">
          <BrandLogo compact />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          <nav aria-label="Primary" className="flex items-center gap-7 text-sm font-medium">
            {orderedNavItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="tracking-[0.16em] text-white/80 transition hover:text-[#FFD700]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
            <Link
              href="/"
              locale="en"
              className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.24em] transition ${
                locale === 'en' ? 'bg-[#FFD700] text-[#231F20]' : 'text-white/70 hover:text-white'
              }`}
            >
              {t('english')}
            </Link>
            <Link
              href="/"
              locale="ar"
              className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.24em] transition ${
                locale === 'ar' ? 'bg-[#FFD700] text-[#231F20]' : 'text-white/70 hover:text-white'
              }`}
            >
              {t('arabic')}
            </Link>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white lg:hidden"
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
        <div className="border-t border-white/10 bg-[#231F20]/98 px-4 pb-5 pt-2 backdrop-blur-xl lg:hidden">
          <nav
            aria-label="Mobile"
            className={`mx-auto flex max-w-7xl flex-col gap-4 text-base font-medium ${
              isRtl ? 'items-end text-right' : 'items-start text-left'
            }`}
          >
            {orderedNavItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="tracking-[0.12em] text-white/85 transition hover:text-[#FFD700]"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-3 flex gap-2">
              <Link
                href="/"
                locale={switchLocale}
                className="rounded-full border border-[#FFD700]/30 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-[#FFD700]"
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
