'use client';

import Image from 'next/image';
import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { SiteCopy } from '@/lib/site-content';

type SectionsProps = {
  copy: SiteCopy;
  locale: 'en' | 'ar';
  isRtl: boolean;
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 }
};

function SectionTitle({
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
  const eyebrowClass = tone === 'light' ? 'text-[#B8860B]/88' : 'text-[#FFD700]/88';
  const introClass = tone === 'light' ? 'text-[#231F20]/78' : 'text-white/72';

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
      <div className={`font-serif text-xs uppercase tracking-[0.22em] sm:tracking-[0.42em] ${eyebrowClass}`}>
        {eyebrow}
      </div>
      <h2 className={`mt-4 text-2xl font-semibold uppercase tracking-[0.08em] sm:text-4xl sm:tracking-[0.24em] lg:text-[2.65rem] ${titleClass}`}>
        {title}
      </h2>
      {intro ? <p className={`mt-5 max-w-2xl text-base leading-8 ${introClass}`}>{intro}</p> : null}
    </motion.div>
  );
}

function SurfaceShell({
  children,
  id,
  className = '',
  variant = 'dark'
}: {
  children: ReactNode;
  id: string;
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
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02),rgba(255,255,255,0.02))] opacity-70" />
      {children}
    </motion.section>
  );
}

function LineIcon({
  icon,
  className = '',
  gold = false
}: {
  icon: 'shield' | 'gem' | 'compass' | 'key' | 'estate' | 'life' | 'management' | 'export';
  className?: string;
  gold?: boolean;
}) {
  const stroke = gold ? '#FFD700' : 'currentColor';
  const fill = gold ? 'rgba(255,215,0,0.15)' : 'transparent';
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

function ArrowIcon({ rtl = false }: { rtl?: boolean }) {
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

export function HeroSection({ copy, isRtl }: { copy: SiteCopy['hero']; isRtl: boolean }) {
  return (
    <section
      id="hero"
      className="relative min-h-[100svh] overflow-hidden bg-spotlight-black pt-32 text-white sm:pt-36"
    >
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=2200&q=80"
          alt="Luxury modern architecture background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(255,215,0,0.18),transparent_28%),linear-gradient(180deg,rgba(35,31,32,0.18),rgba(35,31,32,0.92))]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 pb-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.8, ease: 'easeOut', staggerChildren: 0.1 }}
          className={`min-w-0 max-w-3xl ${isRtl ? 'lg:order-2 lg:text-right' : 'lg:order-1 lg:text-left'}`}
        >
          <div className="font-serif text-xs uppercase tracking-[0.28em] text-[#FFD700]/90 sm:tracking-[0.48em]">
            {copy.eyebrow}
          </div>
          <h1 className="mt-6 text-4xl font-semibold uppercase tracking-[0.12em] sm:text-6xl sm:tracking-[0.28em] lg:text-[5.3rem]">
            <span className="block bg-[linear-gradient(90deg,#B8860B_0%,#FFD700_50%,#B8860B_100%)] bg-clip-text text-transparent">
              {copy.titleLine1}
            </span>
            <span className="mt-3 block text-white/96">{copy.titleLine2}</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/74 sm:text-lg">{copy.subtitle}</p>

          <div
            className={`mt-10 flex flex-wrap gap-4 ${isRtl ? 'flex-row-reverse justify-end' : 'justify-start'}`}
          >
            <a
              href="#properties"
              className="inline-flex items-center gap-3 rounded-full bg-[#FFD700] px-6 py-3 text-sm font-semibold tracking-[0.2em] text-[#231F20] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(255,215,0,0.18)]"
            >
              {copy.primaryCta}
              <ArrowIcon rtl={isRtl} />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-3 rounded-full border border-white/18 bg-white/6 px-6 py-3 text-sm font-semibold tracking-[0.2em] text-white transition hover:border-[#FFD700]/70 hover:text-[#FFD700]"
            >
              {copy.secondaryCta}
              <ArrowIcon rtl={isRtl} />
            </a>
          </div>

          <div className="mt-12 grid max-w-2xl grid-cols-3 gap-2 rounded-[1.75rem] border border-white/10 bg-white/6 p-4 backdrop-blur-sm sm:gap-4 sm:p-5">
            {[
              { label: copy.statLabel1, value: copy.statValue1 },
              { label: copy.statLabel2, value: copy.statValue2 },
              { label: copy.statLabel3, value: copy.statValue3 }
            ].map((item) => (
              <div key={item.label} className="min-w-0 space-y-2 text-center">
                <div className="truncate text-[0.65rem] uppercase tracking-[0.14em] text-white/56 sm:text-xs sm:tracking-[0.28em]">
                  {item.label}
                </div>
                <div className="truncate text-lg font-semibold tracking-[0.08em] text-[#FFD700] sm:text-2xl sm:tracking-[0.2em]">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.08 }}
          className={`relative flex min-w-0 items-end ${isRtl ? 'lg:order-1' : 'lg:order-2'}`}
        >
          <div className="relative ml-auto w-full max-w-md min-w-0 rounded-[2rem] border border-white/12 bg-black/30 p-4 shadow-[0_26px_70px_rgba(0,0,0,0.34)] backdrop-blur-sm">
            <div className="overflow-hidden rounded-[1.45rem] border border-white/10">
              <Image
                src="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80"
                alt="Luxury interior"
                width={900}
                height={1200}
                className="h-[32rem] w-full object-cover object-center opacity-92"
              />
            </div>
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_20%_15%,rgba(255,215,0,0.23),transparent_26%),linear-gradient(180deg,rgba(35,31,32,0),rgba(35,31,32,0.44))]" />
            <div className="absolute bottom-8 left-8 right-8 rounded-[1.25rem] border border-white/12 bg-[#231F20]/72 p-5 backdrop-blur-md">
              <div className="font-serif text-xs uppercase tracking-[0.42em] text-[#FFD700]/90">
                GOLD Signature
              </div>
              <p className="mt-3 text-sm leading-7 text-white/76">
                Premium homes, private guidance, and a holding platform designed for long-term value.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function AboutSection({ copy, isRtl }: { copy: SiteCopy['about']; isRtl: boolean }) {
  return (
    <SurfaceShell id="about" variant="light" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className={`min-w-0 ${isRtl ? 'lg:order-2 text-right' : 'lg:order-1'}`}>
          <SectionTitle eyebrow={copy.eyebrow} title={copy.title} isRtl={isRtl} tone="light" />
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 0.7 }}
            className="mt-8 max-w-2xl text-base leading-8 text-[#231F20]/82"
          >
            {copy.story}
          </motion.p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-120px' }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="rounded-[1.6rem] border border-[#231F20]/10 bg-white/70 p-6 shadow-[0_20px_50px_rgba(35,31,32,0.08)]"
            >
              <div className="font-serif text-xs uppercase tracking-[0.38em] text-[#B8860B]">
                {copy.missionLabel}
              </div>
              <p className="mt-4 text-sm leading-7 text-[#231F20]/82">{copy.mission}</p>
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-120px' }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="rounded-[1.6rem] border border-[#231F20]/10 bg-[#C8D6D9]/45 p-6 shadow-[0_20px_50px_rgba(35,31,32,0.08)]"
            >
              <div className="font-serif text-xs uppercase tracking-[0.38em] text-[#B8860B]">
                {copy.visionLabel}
              </div>
              <p className="mt-4 text-sm leading-7 text-[#231F20]/82">{copy.vision}</p>
            </motion.div>
          </div>
        </div>

        <div className={`relative min-w-0 ${isRtl ? 'lg:order-1' : 'lg:order-2'}`}>
          <div className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-[#231F20] p-5 text-white shadow-[0_26px_70px_rgba(35,31,32,0.18)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_14%,rgba(255,215,0,0.34),transparent_25%),radial-gradient(circle_at_18%_84%,rgba(255,255,255,0.05),transparent_24%)]" />
            <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div className="min-w-0 space-y-5">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                  <div className="h-48 rounded-[1rem] bg-[linear-gradient(135deg,rgba(255,215,0,0.9),rgba(184,134,11,0.82),rgba(255,215,0,0.55))] shadow-[inset_0_0_40px_rgba(255,255,255,0.18)]" />
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
                  <div className="font-serif text-xs uppercase tracking-[0.38em] text-[#FFD700]/90">
                    {copy.signature}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/72">{copy.quote}</p>
                </div>
              </div>

              <div className="min-w-0 rounded-[1.8rem] border border-white/10 bg-black/30 p-5 backdrop-blur-md">
                <div className="overflow-hidden rounded-[1.25rem]">
                  <Image
                    src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
                    alt="Black and white luxury family portrait"
                    width={900}
                    height={1200}
                    className="h-[26rem] w-full object-cover object-center grayscale contrast-110"
                  />
                </div>
                <p className="mt-4 text-sm leading-7 text-white/70">
                  {copy.story.slice(0, 132)}...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SurfaceShell>
  );
}

export function USPSection({ copy, isRtl }: { copy: SiteCopy['usps']; isRtl: boolean }) {
  return (
    <SurfaceShell id="why-gold" variant="dark" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow={copy.eyebrow} title={copy.title} isRtl={isRtl} />

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {copy.items.map((item, index) => (
            <motion.article
              key={item.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-120px' }}
              transition={{ duration: 0.7, delay: index * 0.05 }}
              className="group rounded-[1.7rem] border border-white/10 bg-white/6 p-6 transition duration-300 hover:-translate-y-1 hover:border-[#FFD700]/45 hover:bg-white/[0.08]"
            >
              <LineIcon icon={item.icon} gold />
              <h3 className="mt-8 text-xl font-semibold uppercase tracking-[0.18em] text-white">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-white/68">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </SurfaceShell>
  );
}

export function PropertiesSection({ copy, isRtl }: { copy: SiteCopy['properties']; isRtl: boolean }) {
  return (
    <SurfaceShell id="properties" variant="light" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow={copy.eyebrow} title={copy.title} isRtl={isRtl} tone="light" />

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {copy.items.map((item, index) => (
            <motion.article
              key={item.name}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-120px' }}
              transition={{ duration: 0.7, delay: index * 0.06 }}
              className="group overflow-hidden rounded-[1.9rem] border border-[#231F20]/10 bg-white shadow-[0_18px_50px_rgba(35,31,32,0.12)] transition hover:-translate-y-1 hover:border-[#B8860B]/35 hover:shadow-[0_24px_68px_rgba(35,31,32,0.16)]"
            >
              <div className="relative h-72 overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className={`object-cover object-center transition duration-700 group-hover:scale-[1.04] ${
                    item.tone === 'mono' ? 'grayscale contrast-110' : ''
                  }`}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(35,31,32,0.05),rgba(35,31,32,0.56))]" />
                <div className="absolute left-6 top-6 rounded-full border border-white/20 bg-black/25 px-4 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.36em] text-white/90 backdrop-blur-sm">
                  GOLD
                </div>
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <h3 className="text-2xl font-semibold tracking-[0.08em] text-[#231F20]">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-sm uppercase tracking-[0.24em] text-[#58595B]">
                    {item.location}
                  </p>
                </div>
                <div className="flex flex-col gap-4 border-t border-[#231F20]/10 pt-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-[#58595B]">Price</div>
                    <div className="mt-2 text-lg font-semibold tracking-[0.08em] text-[#231F20]">
                      {item.price}
                    </div>
                  </div>
                  <a
                    href="#contact"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#231F20]/12 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#231F20] transition hover:border-[#B8860B] hover:text-[#B8860B]"
                  >
                    View Details
                    <ArrowIcon rtl={isRtl} />
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </SurfaceShell>
  );
}

export function SubbrandStrip({ copy, isRtl }: { copy: SiteCopy['subbrands']; isRtl: boolean }) {
  return (
    <section id="subbrands" className="border-y border-white/10 bg-[#1a1718] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className={`flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between ${isRtl ? 'text-right' : ''}`}>
          <div>
            <div className="font-serif text-xs uppercase tracking-[0.42em] text-[#FFD700]/88">
              {copy.eyebrow}
            </div>
            <h2 className="mt-4 text-2xl font-semibold uppercase tracking-[0.22em] text-white">
              {copy.title}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {copy.items.map((item) => (
              <div
                key={item.name}
                className="rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-4 transition hover:border-[#FFD700]/35 hover:bg-white/[0.05]"
              >
                <LineIcon icon={item.icon} gold className="h-9 w-9" />
                <div className="mt-4 text-sm font-semibold tracking-[0.18em] text-white">
                  {item.name}
                </div>
                <p className="mt-2 text-xs leading-6 text-white/58">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function InquiryForm({
  labels,
  isRtl
}: {
  labels: SiteCopy['contact'];
  isRtl: boolean;
}) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    interest: '',
    message: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
    setSubmitted(false);
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof typeof form, string>> = {};
    if (!form.name.trim()) nextErrors.name = labels.errors.name;
    if (!/^[+()0-9\s-]{7,}$/.test(form.phone.trim())) nextErrors.phone = labels.errors.phone;
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = labels.errors.email;
    if (!form.message.trim()) nextErrors.message = labels.errors.message;
    if (!form.interest.trim()) nextErrors.interest = labels.errors.interest;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        throw new Error('Inquiry email failed');
      }

      setSubmitted(true);
      setForm({
        name: '',
        phone: '',
        email: '',
        interest: '',
        message: ''
      });
    } catch {
      setFormError(
        isRtl
          ? 'تعذر إرسال الاستفسار الآن. حاول مرة أخرى لاحقاً.'
          : 'We could not send your inquiry right now. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={labels.name}
          value={form.name}
          error={errors.name}
          onChange={(value) => update('name', value)}
          placeholder={labels.name}
          isRtl={isRtl}
        />
        <Field
          label={labels.phone}
          value={form.phone}
          error={errors.phone}
          onChange={(value) => update('phone', value)}
          placeholder="+20 1..."
          isRtl={isRtl}
        />
      </div>
      <Field
        label={labels.email}
        value={form.email}
        error={errors.email}
        onChange={(value) => update('email', value)}
        placeholder="name@example.com"
        isRtl={isRtl}
      />
      <label className="block">
        <span className="mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-white/72">
          {labels.interest}
        </span>
        <select
          value={form.interest}
          onChange={(event) => update('interest', event.target.value)}
          className={`w-full rounded-[1rem] border bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#FFD700] focus:ring-2 focus:ring-[#FFD700]/22 ${
            errors.interest ? 'border-red-400/70' : 'border-white/12'
          }`}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <option value="" className="bg-[#231F20] text-white/60">
            {labels.placeholderInterest}
          </option>
          {labels.options.map((option) => (
            <option key={option} value={option} className="bg-[#231F20] text-white">
              {option}
            </option>
          ))}
        </select>
        {errors.interest ? <p className="mt-2 text-xs text-red-300">{errors.interest}</p> : null}
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-white/72">
          {labels.message}
        </span>
        <textarea
          value={form.message}
          onChange={(event) => update('message', event.target.value)}
          rows={5}
          className={`w-full rounded-[1rem] border bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#FFD700] focus:ring-2 focus:ring-[#FFD700]/22 ${
            errors.message ? 'border-red-400/70' : 'border-white/12'
          }`}
          placeholder={labels.message}
        />
        {errors.message ? <p className="mt-2 text-xs text-red-300">{errors.message}</p> : null}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center gap-3 rounded-full bg-[#FFD700] px-6 py-3 text-sm font-semibold tracking-[0.2em] text-[#231F20] transition hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(255,215,0,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (isRtl ? 'جار الإرسال...' : 'Sending...') : labels.submit}
        <ArrowIcon rtl={isRtl} />
      </button>

      {formError ? <p className="text-sm text-red-300">{formError}</p> : null}
      {submitted ? <p className="text-sm text-[#FFD700]">{labels.success}</p> : null}
    </form>
  );
}

function Field({
  label,
  value,
  error,
  onChange,
  placeholder,
  isRtl
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder: string;
  isRtl: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-white/72">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`w-full rounded-[1rem] border bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#FFD700] focus:ring-2 focus:ring-[#FFD700]/22 ${
          error ? 'border-red-400/70' : 'border-white/12'
        }`}
      />
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </label>
  );
}

export function ContactSection({ copy, isRtl }: { copy: SiteCopy['contact']; isRtl: boolean }) {
  return (
    <SurfaceShell id="contact" variant="spotlight" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} isRtl={isRtl} />

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div
            className={`min-w-0 rounded-[2rem] border border-white/10 bg-[#231F20]/78 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-8 ${
              isRtl ? 'lg:order-2' : 'lg:order-1'
            }`}
          >
            <div className="font-serif text-xs uppercase tracking-[0.4em] text-[#FFD700]/90">
              {copy.formTitle}
            </div>
            <div className="mt-6">
              <InquiryForm labels={copy} isRtl={isRtl} />
            </div>
          </div>

          <div className={`min-w-0 grid gap-6 ${isRtl ? 'lg:order-1' : 'lg:order-2'}`}>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-8">
              <div className="font-serif text-xs uppercase tracking-[0.4em] text-[#FFD700]/90">
                {copy.addressLabel}
              </div>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/74">{copy.address}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoCard label={copy.hotlineLabel} value={copy.hotline} />
                <InfoCard label={copy.emailLabel} value={copy.emailValue} />
              </div>
              <a
                href="https://www.google.com/maps?q=The%20Office,%20Tulip,%2090th%20Street,%205th%20Settlement,%20New%20Cairo,%20Egypt&output=embed"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#FFD700]"
              >
                {copy.mapCta}
                <ArrowIcon rtl={isRtl} />
              </a>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/25 shadow-[0_24px_64px_rgba(0,0,0,0.28)]">
              <iframe
                title="GOLD office map"
                src="https://www.google.com/maps?q=The%20Office,%20Tulip,%2090th%20Street,%205th%20Settlement,%20New%20Cairo,%20Egypt&output=embed"
                className="h-[22rem] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </SurfaceShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-black/22 px-4 py-4">
      <div className="text-xs uppercase tracking-[0.26em] text-white/52">{label}</div>
      <div className="mt-3 text-sm font-medium leading-6 text-white">{value}</div>
    </div>
  );
}
