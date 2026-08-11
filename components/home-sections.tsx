'use client';

import Image from 'next/image';
import { useState, type FormEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import type { SiteCopy } from '@/lib/site-content';
import type { Property } from '@/lib/properties-store';
import { LOCATIONS, PROPERTY_TYPES } from '@/lib/property-taxonomy';
import { GMark } from './gmark';
import { fadeUp, SectionTitle, SurfaceShell, LineIcon, ArrowIcon } from './section-ui';
import { PropertyCard } from './property-card';
import { PartnersMarquee } from './partners-marquee';

function SearchChevron({ isRtl }: { isRtl: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/50 ${
        isRtl ? 'left-5' : 'right-5'
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SearchSelect({
  ariaLabel,
  value,
  onChange,
  isRtl,
  children
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  isRtl: boolean;
  children: ReactNode;
}) {
  return (
    <label className="relative block w-full sm:flex-1">
      <span className="sr-only">{ariaLabel}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`w-full appearance-none rounded-full border border-white/15 bg-white/8 py-3 text-sm text-white outline-none transition focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)] sm:rounded-none sm:border-0 sm:bg-transparent sm:focus:ring-0 ${
          isRtl ? 'pl-11 pr-5' : 'pl-5 pr-11'
        }`}
      >
        {children}
      </select>
      <SearchChevron isRtl={isRtl} />
    </label>
  );
}

export function HeroSearch({
  copy,
  locale,
  isRtl
}: {
  copy: SiteCopy['home']['hero'];
  locale: 'en' | 'ar';
  isRtl: boolean;
}) {
  const router = useRouter();
  const [propertyType, setPropertyType] = useState('any');
  const [location, setLocation] = useState('any');
  const [maxPrice, setMaxPrice] = useState('any');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (propertyType !== 'any') params.set('type', propertyType);
    if (location !== 'any') params.set('location', location);
    if (maxPrice !== 'any') params.set('maxPrice', maxPrice);
    const query = params.toString();
    router.push(`/properties${query ? `?${query}` : ''}`);
  };

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-spotlight-black pt-32 text-white sm:pt-36">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=2200&q=80"
          alt="Luxury modern architecture background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(212,175,55,0.16),transparent_28%),linear-gradient(180deg,rgba(35,31,32,0.18),rgba(35,31,32,0.92))]" />
      </div>

      <GMark
        tone="gold"
        size={760}
        className={`-bottom-40 opacity-[0.05] ${isRtl ? '-left-40 scale-x-[-1]' : '-right-40'}`}
      />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pb-20 text-center sm:px-6 lg:px-8">
        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.8, ease: 'easeOut' }}>
          <div className="font-serif text-xs uppercase tracking-[0.48em] text-[rgba(217,179,85,0.9)]">{copy.eyebrow}</div>
          <h1 className="mt-6 text-4xl font-medium uppercase tracking-[0.1em] sm:text-5xl lg:text-6xl">
            <span className="bg-[linear-gradient(90deg,#8B6508_0%,#D4AF37_28%,#F1D878_50%,#D4AF37_72%,#8B6508_100%)] bg-clip-text text-transparent">
              {copy.title}
            </span>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-base leading-8 text-white/74 sm:text-lg">{copy.subtitle}</p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className={`mt-10 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 ${
            isRtl ? 'sm:flex-row-reverse' : ''
          }`}
        >
          <div
            className={`flex w-full flex-col gap-3 sm:flex-1 sm:items-stretch sm:gap-0 sm:divide-x sm:divide-white/12 sm:rounded-full sm:border sm:border-white/15 sm:bg-white/8 sm:backdrop-blur-sm ${
              isRtl ? 'sm:flex-row-reverse sm:divide-x-reverse' : 'sm:flex-row'
            }`}
          >
            <SearchSelect
              ariaLabel={copy.search.propertyTypeLabel}
              value={propertyType}
              onChange={setPropertyType}
              isRtl={isRtl}
            >
              <option value="any">{copy.search.anyPropertyType}</option>
              {PROPERTY_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item[locale]}
                </option>
              ))}
            </SearchSelect>
            <SearchSelect
              ariaLabel={copy.search.locationLabel}
              value={location}
              onChange={setLocation}
              isRtl={isRtl}
            >
              <option value="any">{copy.search.anyLocation}</option>
              {LOCATIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item[locale]}
                </option>
              ))}
            </SearchSelect>
            <SearchSelect
              ariaLabel={copy.search.budgetLabel}
              value={maxPrice}
              onChange={setMaxPrice}
              isRtl={isRtl}
            >
              <option value="any">{copy.search.anyBudget}</option>
              {copy.search.priceBuckets.map((bucket) => (
                <option key={bucket.max} value={bucket.max}>
                  {bucket.label}
                </option>
              ))}
            </SearchSelect>
          </div>
          <button
            type="submit"
            className="btn-gold inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-sm font-medium uppercase tracking-[0.18em]"
          >
            {copy.search.submit}
          </button>
        </motion.form>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.18 }}
          className="mt-12 grid w-full max-w-2xl grid-cols-3 gap-4 rounded-[1.75rem] border border-white/10 bg-white/6 p-5 backdrop-blur-sm"
        >
          {[
            { label: copy.statLabel1, value: copy.statValue1 },
            { label: copy.statLabel2, value: copy.statValue2 },
            { label: copy.statLabel3, value: copy.statValue3 }
          ].map((item) => (
            <div key={item.label} className="space-y-2 text-center">
              <div className="text-xs uppercase tracking-[0.28em] text-white/56">{item.label}</div>
              <div className="gold-gradient-text text-2xl font-medium tracking-[0.16em]">{item.value}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function TrustStrip({ copy, isRtl }: { copy: SiteCopy['home']['trust']; isRtl: boolean }) {
  return (
    <SurfaceShell variant="dark" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow={copy.eyebrow} title={copy.title} isRtl={isRtl} tone="dark" />
        <div className="mt-12 grid gap-8 border-t border-white/10 pt-10 md:grid-cols-2 xl:grid-cols-4 md:gap-x-10 md:gap-y-10">
          {copy.items.map((item, index) => (
            <motion.article
              key={item.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-120px' }}
              transition={{ duration: 0.7, delay: index * 0.05 }}
            >
              <LineIcon icon={item.icon} gold />
              <h3 className="mt-6 text-xl font-medium uppercase tracking-[0.14em] text-white">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-white/68">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </SurfaceShell>
  );
}

export function FeaturedProperties({
  copy,
  properties,
  locale,
  isRtl
}: {
  copy: SiteCopy['home']['featured'];
  properties: Property[];
  locale: 'en' | 'ar';
  isRtl: boolean;
}) {
  return (
    <SurfaceShell variant="light" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div
          className={`flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between ${
            isRtl ? 'sm:flex-row-reverse' : ''
          }`}
        >
          <SectionTitle eyebrow={copy.eyebrow} title={copy.title} isRtl={isRtl} tone="light" />
          <Link
            href="/properties"
            locale={locale}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[rgba(35,31,32,0.15)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#231F20] transition hover:border-[#B8860B] hover:text-[#B8860B]"
          >
            {copy.viewAllCta}
            <ArrowIcon rtl={isRtl} />
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
          {properties.map((property, index) => (
            <PropertyCard
              key={property.id}
              property={property}
              locale={locale}
              isRtl={isRtl}
              viewDetailsLabel={copy.viewAllCta}
              delay={index * 0.06}
            />
          ))}
        </div>
      </div>
    </SurfaceShell>
  );
}

export function HomePartners({ copy, isRtl }: { copy: SiteCopy['home']['partners']; isRtl: boolean }) {
  return (
    <SurfaceShell variant="dark" className="py-16">
      <PartnersMarquee eyebrow={copy.eyebrow} title={copy.title} isRtl={isRtl} />
    </SurfaceShell>
  );
}

export function ContactCta({
  copy,
  locale,
  isRtl
}: {
  copy: SiteCopy['home']['contactCta'];
  locale: 'en' | 'ar';
  isRtl: boolean;
}) {
  return (
    <SurfaceShell variant="spotlight" className="px-4 py-20 text-center sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="font-serif text-xs uppercase tracking-[0.42em] text-[rgba(217,179,85,0.88)]">{copy.eyebrow}</div>
        <h2 className="mt-4 text-3xl font-medium uppercase tracking-[0.14em] text-white sm:text-4xl">
          {copy.title}
        </h2>
        <p className="mt-4 text-base leading-8 text-white/72">{copy.subtitle}</p>
        <Link
          href="/contact"
          locale={locale}
          className="btn-gold mt-8 inline-flex items-center gap-3 rounded-full px-7 py-3 text-sm font-medium uppercase tracking-[0.2em]"
        >
          {copy.cta}
          <ArrowIcon rtl={isRtl} />
        </Link>
      </div>
    </SurfaceShell>
  );
}
