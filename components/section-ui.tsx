'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 }
};

export function SectionTitle({
  eyebrow,
  title,
  intro,
  align = 'left',
  isRtl,
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
  const introClass = tone === 'light' ? 'text-[rgba(35,31,32,0.78)]' : 'text-white/72';

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-120px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={`max-w-3xl ${align === 'center' ? 'mx-auto text-center' : ''} ${
        isRtl ? 'text-right' : 'text-left'
      }`}
    >
      <div className={`font-serif text-xs uppercase tracking-[0.42em] ${eyebrowClass}`}>{eyebrow}</div>
      <h2 className={`mt-4 text-3xl font-medium uppercase tracking-[0.18em] sm:text-4xl lg:text-[2.65rem] ${titleClass}`}>
        {title}
      </h2>
      {intro ? <p className={`mt-5 max-w-2xl text-base leading-8 ${introClass}`}>{intro}</p> : null}
    </motion.div>
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
    <motion.section
      id={id}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={`relative overflow-hidden ${background} ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02),rgba(255,255,255,0.02))] opacity-70" />
      {children}
    </motion.section>
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
