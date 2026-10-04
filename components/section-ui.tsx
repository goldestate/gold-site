'use client';

import type { ReactNode } from 'react';

/**
 * A section's eyebrow, headline and intro. Alignment follows the page's
 * direction, so nothing here mirrors by hand.
 *
 * Sections used to fade in on scroll from opacity 0, which left whole pages
 * blank until the scripts ran. They are visible from the first paint now.
 */
export function SectionTitle({
  eyebrow,
  title,
  intro,
  align = 'left',
  tone = 'dark'
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  align?: 'left' | 'center';
  isRtl: boolean;
  tone?: 'dark' | 'light';
}) {
  const titleClass = tone === 'light' ? 'text-[#231F20]' : 'text-white';
  const eyebrowClass = tone === 'light' ? 'text-[rgba(184,134,11,0.88)]' : 'text-[rgba(217,179,85,0.88)]';
  const introClass = tone === 'light' ? 'text-[rgba(35,31,32,0.78)]' : 'text-white/[0.72]';

  return (
    <div className={`max-w-3xl ${align === 'center' ? 'mx-auto text-center' : 'text-start'}`}>
      <div className={`font-serif text-xs uppercase tracking-[0.42em] ${eyebrowClass}`}>{eyebrow}</div>
      <h2 className={`mt-4 text-3xl font-medium uppercase tracking-[0.18em] sm:text-4xl lg:text-[2.65rem] ${titleClass}`}>
        {title}
      </h2>
      {intro ? <p className={`mt-5 max-w-2xl text-base leading-8 ${introClass}`}>{intro}</p> : null}
    </div>
  );
}

export function SurfaceShell({
  children,
  id,
  className = '',
  variant = 'dark'
}: {
  children: ReactNode;
  id?: string;
  className?: string;
  variant?: 'dark' | 'spotlight' | 'light';
}) {
  const background =
    variant === 'spotlight'
      ? 'bg-spotlight-black'
      : variant === 'light'
        ? 'bg-[#E2E1D4] text-[#231F20]'
        : 'bg-middle-black';

  return (
    <section id={id} className={`relative overflow-hidden ${background} ${className}`}>
      {children}
    </section>
  );
}

export type LineIconName =
  | 'shield'
  | 'gem'
  | 'compass'
  | 'key'
  | 'estate'
  | 'life'
  | 'management'
  | 'export';

export function LineIcon({
  icon,
  className = '',
  gold = false
}: {
  icon: LineIconName;
  className?: string;
  gold?: boolean;
}) {
  const stroke = gold ? '#D9B355' : 'currentColor';
  const fill = gold ? 'rgba(217,179,85,0.14)' : 'transparent';
  const base = `h-11 w-11 ${className}`;

  const shared = {
    fill: 'none',
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };

  if (icon === 'shield') {
    return (
      <svg className={base} viewBox="0 0 48 48" aria-hidden="true">
        <path {...shared} d="M24 6 38 11v11c0 9-5.7 16.1-14 20-8.3-3.9-14-11-14-20V11L24 6Z" />
        <path {...shared} d="M24 14v20" />
        <path {...shared} d="M15 20c3.2 1.2 5.9 3.8 9 9 3.1-5.2 5.8-7.8 9-9" />
      </svg>
    );
  }

  if (icon === 'gem') {
    return (
      <svg className={base} viewBox="0 0 48 48" aria-hidden="true">
        <path {...shared} d="M12 18 18 10h12l6 8-12 20L12 18Z" fill={fill} />
        <path {...shared} d="M18 10 24 18l6-8" />
        <path {...shared} d="M12 18h24" />
        <path {...shared} d="M18 10 12 18l12 20 12-20-6-8" />
      </svg>
    );
  }

  if (icon === 'compass') {
    return (
      <svg className={base} viewBox="0 0 48 48" aria-hidden="true">
        <circle {...shared} cx="24" cy="24" r="16" />
        <path {...shared} d="M24 14v20" />
        <path {...shared} d="M14 24h20" />
        <path {...shared} d="M28 20 20 28" />
      </svg>
    );
  }

  if (icon === 'key') {
    return (
      <svg className={base} viewBox="0 0 48 48" aria-hidden="true">
        <circle {...shared} cx="18" cy="22" r="8" />
        <path {...shared} d="M24 22h16" />
        <path {...shared} d="M34 22v6" />
        <path {...shared} d="M30 22v4" />
      </svg>
    );
  }

  if (icon === 'estate') {
    return (
      <svg className={base} viewBox="0 0 48 48" aria-hidden="true">
        <path {...shared} d="M12 22 24 12l12 10" />
        <path {...shared} d="M16 20v16h16V20" />
        <path {...shared} d="M22 36V28h4v8" />
      </svg>
    );
  }

  if (icon === 'life') {
    return (
      <svg className={base} viewBox="0 0 48 48" aria-hidden="true">
        <path {...shared} d="M12 18c8-10 16 10 24 0" />
        <path {...shared} d="M12 26c8-10 16 10 24 0" />
        <path {...shared} d="M12 34c8-10 16 10 24 0" />
      </svg>
    );
  }

  if (icon === 'management') {
    return (
      <svg className={base} viewBox="0 0 48 48" aria-hidden="true">
        <rect {...shared} x="10" y="12" width="28" height="24" rx="4" fill={fill} />
        <path {...shared} d="M16 18h16" />
        <path {...shared} d="M16 24h10" />
        <path {...shared} d="M16 30h12" />
      </svg>
    );
  }

  return (
    <svg className={base} viewBox="0 0 48 48" aria-hidden="true">
      <path {...shared} d="M14 14h20v20H14z" fill={fill} />
      <path {...shared} d="M14 14 24 24 34 14" />
      <path {...shared} d="M14 34 24 24 34 34" />
    </svg>
  );
}

export function UnitTypeIcon({ type, className = '' }: { type: string; className?: string }) {
  const shared = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };
  const base = `h-6 w-6 ${className}`;

  if (type === 'chalet') {
    return (
      <svg className={base} viewBox="0 0 24 24" aria-hidden="true">
        <path {...shared} d="M4 12 12 5l8 7" />
        <path {...shared} d="M6 11v8h12v-8" />
        <path {...shared} d="M10 19v-5h4v5" />
      </svg>
    );
  }

  if (type === 'townhouse') {
    return (
      <svg className={base} viewBox="0 0 24 24" aria-hidden="true">
        <path {...shared} d="M2 10 6 6l4 4" />
        <path {...shared} d="M10 8l4-4 4 4" />
        <path {...shared} d="M3 10v9h6v-9" />
        <path {...shared} d="M9 8v11" />
        <path {...shared} d="M11 8v11h10v-9" />
      </svg>
    );
  }

  if (type === 'twinhouse') {
    return (
      <svg className={base} viewBox="0 0 24 24" aria-hidden="true">
        <path {...shared} d="M2 11 7 6l5 5" />
        <path {...shared} d="M12 11l5-5 5 5" />
        <path {...shared} d="M3 11v8h8v-8" />
        <path {...shared} d="M13 11v8h8v-8" />
        <path {...shared} d="M7 19v-4" />
        <path {...shared} d="M17 19v-4" />
      </svg>
    );
  }

  if (type === 'villa') {
    return (
      <svg className={base} viewBox="0 0 24 24" aria-hidden="true">
        <path {...shared} d="M4 11 12 4l8 7" />
        <path {...shared} d="M6 10v6h12v-6" />
        <path {...shared} d="M2 20c1.4-1.2 2.6-1.2 4 0 1.4-1.2 2.6-1.2 4 0 1.4-1.2 2.6-1.2 4 0 1.4-1.2 2.6-1.2 4 0 1.4-1.2 2.6-1.2 4 0" />
      </svg>
    );
  }

  if (type === 'duplex') {
    return (
      <svg className={base} viewBox="0 0 24 24" aria-hidden="true">
        <rect {...shared} x="4" y="4" width="16" height="16" rx="1" />
        <path {...shared} d="M4 12h16" />
        <path {...shared} d="M8 20v-3h3v-3h3" />
        <path {...shared} d="M8 9h3" />
        <path {...shared} d="M14 9h2" />
      </svg>
    );
  }

  if (type === 'commercial') {
    return (
      <svg className={base} viewBox="0 0 24 24" aria-hidden="true">
        <rect {...shared} x="4" y="8" width="16" height="12" rx="1" />
        <path {...shared} d="M9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8" />
        <path {...shared} d="M4 13h16" />
      </svg>
    );
  }

  if (type === 'administrative') {
    return (
      <svg className={base} viewBox="0 0 24 24" aria-hidden="true">
        <path {...shared} d="M4 10 12 4l8 6" />
        <path {...shared} d="M5 10v10h14V10" />
        <path {...shared} d="M9 20v-6h6v6" />
        <path {...shared} d="M9 14V10" />
        <path {...shared} d="M15 14V10" />
      </svg>
    );
  }

  return (
    <svg className={base} viewBox="0 0 24 24" aria-hidden="true">
      <rect {...shared} x="4" y="9" width="16" height="11" />
      <path {...shared} d="M4 9 12 4l8 5" />
      <path {...shared} d="M8 20v-5h3v5" />
      <path {...shared} d="M9 12h2" />
      <path {...shared} d="M13 12h2" />
      <path {...shared} d="M13 16h2" />
    </svg>
  );
}

export function StatIcon({
  icon,
  className = ''
}: {
  icon: 'bed' | 'bath' | 'area';
  className?: string;
}) {
  const shared = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };
  const base = `h-4 w-4 ${className}`;

  if (icon === 'bed') {
    return (
      <svg className={base} viewBox="0 0 24 24" aria-hidden="true">
        <path {...shared} d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" />
        <path {...shared} d="M3 18v2" />
        <path {...shared} d="M21 18v2" />
        <path {...shared} d="M3 13v-1a2 2 0 0 1 2-2h6v4" />
        <path {...shared} d="M13 13v-3h6a2 2 0 0 1 2 2v1" />
      </svg>
    );
  }

  if (icon === 'bath') {
    return (
      <svg className={base} viewBox="0 0 24 24" aria-hidden="true">
        <path {...shared} d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3Z" />
        <path {...shared} d="M4 12V7a2 2 0 0 1 2-2c1.2 0 2 .8 2 2" />
        <path {...shared} d="M8 20v2" />
        <path {...shared} d="M16 20v2" />
      </svg>
    );
  }

  return (
    <svg className={base} viewBox="0 0 24 24" aria-hidden="true">
      <path {...shared} d="M4 9V4h5" />
      <path {...shared} d="M20 9V4h-5" />
      <path {...shared} d="M4 15v5h5" />
      <path {...shared} d="M20 15v5h-5" />
    </svg>
  );
}

export function FunnelIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 flex-none ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16" />
      <path d="M7.5 12h9" />
      <path d="M10.5 18h3" />
    </svg>
  );
}

export function PhoneIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 flex-none ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.7 21 3 13.3 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8Z" />
    </svg>
  );
}

/** WhatsApp's own glyph, in one colour so it takes the button's text colour. */
export function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 flex-none ${className}`} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export function ArrowIcon({ rtl = false }: { rtl?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${rtl ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
