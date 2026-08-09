import { Link } from '@/i18n/navigation';
import { BrandLogo } from './brand-logo';
import type { SiteCopy } from '@/lib/site-content';

type SiteFooterProps = {
  copy: SiteCopy;
  locale: 'en' | 'ar';
};

export function SiteFooter({ copy, locale }: SiteFooterProps) {
  const switchLocale = locale === 'en' ? 'ar' : 'en';

  return (
    <footer className="border-t border-white/10 bg-[#171314] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div
          className={`flex flex-col gap-8 lg:items-start lg:justify-between ${
            locale === 'ar' ? 'lg:flex-row-reverse text-right' : 'lg:flex-row'
          }`}
        >
          <div className="max-w-md">
            <BrandLogo />
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/68">{copy.footer.tagline}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {copy.footer.sublinks.map((item) => (
              <a
                key={item}
                href="#subbrands"
                className="text-sm tracking-[0.18em] text-white/72 transition hover:text-[#FFD700]"
              >
                {item}
              </a>
            ))}
          </div>
        </div>

        <div
          className={`flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/58 sm:items-center sm:justify-between ${
            locale === 'ar' ? 'sm:flex-row-reverse text-right' : 'sm:flex-row'
          }`}
        >
          <p>{copy.footer.legal}</p>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              locale={locale}
              className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.24em] ${
                locale === 'en' ? 'bg-[#FFD700] text-[#231F20]' : 'border border-white/15 text-white/75'
              }`}
            >
              EN
            </Link>
            <Link
              href="/"
              locale={switchLocale}
              className={`rounded-full px-3 py-1 text-xs font-semibold tracking-[0.24em] ${
                locale === 'ar' ? 'bg-[#FFD700] text-[#231F20]' : 'border border-white/15 text-white/75'
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
