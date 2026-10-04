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
    <SurfaceShell variant="spotlight" className="relative overflow-hidden px-4 pb-28 pt-32 sm:px-6 sm:pb-36 sm:pt-40 lg:px-8">
      <GMark tone="gold" size={560} className="-end-24 -top-24 opacity-[0.05]" />
      <div className="relative mx-auto max-w-3xl">
        <Link
          href="/about#subbrands"
          locale={locale}
          className="label-caps inline-flex items-center gap-2 text-white/50 transition hover:text-white/80"
        >
          <ArrowIcon rtl={!isRtl} />
          {backLabel}
        </Link>

        <div className="mt-10 flex items-center gap-4">
          <LineIcon icon={icon} gold className="h-12 w-12" />
          {comingSoonLabel ? (
            <span className="rounded-full bg-[rgba(217,179,85,0.12)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D9B355]">
              {comingSoonLabel}
            </span>
          ) : null}
        </div>

        <div className="eyebrow mt-7 text-[#D9B355]">{eyebrow}</div>
        <h1 className="font-display mt-3 text-[2.4rem] leading-[1.1] text-[#F4F0E8] sm:text-[3.2rem]">{title}</h1>
        <p className="mt-6 text-base leading-8 text-white/75 sm:text-lg">{body}</p>

        {services ? (
          <div className="mt-8">
            <div className="label-caps text-white/50">{services.label}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {services.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#D9B355] ring-1 ring-white/10"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {partners ? (
          <p className="mt-6 text-sm text-white/55">
            {partners.label}: {partners.items.join(' · ')}
          </p>
        ) : null}

        <Link
          href="/contact"
          locale={locale}
          className="btn-gold mt-10 inline-flex h-12 items-center gap-3 rounded-full px-8 text-sm font-semibold uppercase tracking-[0.14em]"
        >
          {ctaLabel}
          <ArrowIcon rtl={isRtl} />
        </Link>
      </div>
    </SurfaceShell>
  );
}
