import { Link } from '@/i18n/navigation';
import { GMark } from './gmark';
import { SurfaceShell, LineIcon, ArrowIcon, type LineIconName } from './section-ui';

export function SubbrandHero({
  eyebrow,
  title,
  body,
  icon,
  isRtl,
  locale,
  backLabel,
  ctaLabel,
  comingSoonLabel,
  services,
  partners
}: {
  eyebrow: string;
  title: string;
  body: string;
  icon: LineIconName;
  isRtl: boolean;
  locale: 'en' | 'ar';
  backLabel: string;
  ctaLabel: string;
  comingSoonLabel?: string;
  services?: { label: string; items: string[] };
  partners?: { label: string; items: string[] };
}) {
  return (
    <SurfaceShell variant="spotlight" className="relative overflow-hidden px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
      <GMark tone="gold" size={560} className={`-top-24 opacity-[0.05] ${isRtl ? '-left-24' : '-right-24'}`} />
      <div className={`relative mx-auto max-w-3xl ${isRtl ? 'text-right' : ''}`}>
        <Link
          href="/about#subbrands"
          locale={locale}
          className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/50 transition hover:text-white/80 ${
            isRtl ? 'flex-row-reverse' : ''
          }`}
        >
          <ArrowIcon rtl={!isRtl} />
          {backLabel}
        </Link>

        <div className={`mt-10 flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <LineIcon icon={icon} gold className="h-12 w-12" />
          {comingSoonLabel ? (
            <span className="rounded-full border border-[rgba(217,179,85,0.4)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[rgba(217,179,85,0.9)]">
              {comingSoonLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-6 font-serif text-xs uppercase tracking-[0.38em] text-[rgba(217,179,85,0.9)]">
          {eyebrow}
        </div>
        <h1 className="mt-3 text-3xl font-medium uppercase tracking-[0.1em] text-white sm:text-4xl">{title}</h1>
        <p className="mt-6 text-base leading-8 text-white/76">{body}</p>

        {services ? (
          <div className="mt-8">
            <div className="text-xs uppercase tracking-[0.24em] text-white/50">{services.label}</div>
            <div className={`mt-3 flex flex-wrap gap-2 ${isRtl ? 'justify-end' : ''}`}>
              {services.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[rgba(217,179,85,0.3)] px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-[rgba(217,179,85,0.9)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {partners ? (
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/50">
            {partners.label}: {partners.items.join(' · ')}
          </p>
        ) : null}

        <Link
          href="/contact"
          locale={locale}
          className="btn-gold mt-10 inline-flex items-center gap-3 rounded-full px-7 py-3 text-sm font-medium uppercase tracking-[0.2em]"
        >
          {ctaLabel}
          <ArrowIcon rtl={isRtl} />
        </Link>
      </div>
    </SurfaceShell>
  );
}
