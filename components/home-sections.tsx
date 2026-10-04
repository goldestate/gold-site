'use client';

import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import type { SiteCopy } from '@/lib/site-content';
import type { Property } from '@/lib/properties-store';
import { LOCATIONS, PROPERTY_TYPES } from '@/lib/property-taxonomy';
import { GoldSelect, type GoldSelectOption } from './gold-select';
import { SectionTitle, SurfaceShell, LineIcon, ArrowIcon } from './section-ui';
import { PropertyCard } from './property-card';
import { PartnersMarquee } from './partners-marquee';

function SearchSelect({
  ariaLabel,
  value,
  onChange,
  isRtl,
  options
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  isRtl: boolean;
  options: GoldSelectOption[];
}) {
  return (
    <GoldSelect
      label={ariaLabel}
      value={value}
      onChange={onChange}
      options={options}
      isRtl={isRtl}
      className="w-full sm:flex-1"
      triggerClassName="h-12 w-full rounded-full border border-white/[0.12] bg-white/[0.06] px-5 text-sm text-white outline-none transition focus-visible:border-[#D9B355] focus-visible:ring-2 focus-visible:ring-[rgba(217,179,85,0.22)] sm:rounded-none sm:border-0 sm:bg-transparent sm:focus-visible:ring-0"
    />
  );
}

/**
 * The opening screen: one of GOLD's own homes (Hacienda West, North Coast, at
 * dusk) under a shade that darkens the side the words sit on. The shade turns
 * with the page direction, so Arabic text gets the dark side too.
 */
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

  const stats = [
    { label: copy.statLabel1, value: copy.statValue1 },
    { label: copy.statLabel2, value: copy.statValue2 },
    { label: copy.statLabel3, value: copy.statValue3 }
  ];

  return (
    <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden bg-[#171314] pb-14 pt-32 text-white sm:pb-20 sm:pt-40">
      <Image
        src="/hero/hacienda-west-dusk.jpg"
        alt={copy.heroImageAlt}
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[60%_50%]"
      />
      <div
        aria-hidden="true"
        className={`absolute inset-0 -z-10 ${
          isRtl
            ? 'bg-[linear-gradient(270deg,rgba(23,19,20,0.94)_0%,rgba(23,19,20,0.74)_40%,rgba(23,19,20,0.3)_78%,rgba(23,19,20,0.18)_100%)]'
            : 'bg-[linear-gradient(90deg,rgba(23,19,20,0.94)_0%,rgba(23,19,20,0.74)_40%,rgba(23,19,20,0.3)_78%,rgba(23,19,20,0.18)_100%)]'
        }`}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(23,19,20,0.6)_0%,rgba(23,19,20,0)_28%,rgba(23,19,20,0)_62%,#1e1a1b_100%)]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="eyebrow text-[#D9B355]">{copy.eyebrow}</div>
          <h1 className="font-display mt-4 text-[2.7rem] leading-[1.04] text-[#F4F0E8] sm:text-6xl lg:text-[4.6rem]">
            {copy.title}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/80 sm:text-lg">{copy.subtitle}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 max-w-4xl rounded-[1.6rem] bg-[rgba(23,19,20,0.6)] p-2 ring-1 ring-white/[0.12] backdrop-blur-md sm:rounded-full"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div
              className={`flex flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:gap-0 sm:divide-x sm:divide-white/10 ${
                isRtl ? 'sm:divide-x-reverse' : ''
              }`}
            >
              <SearchSelect
                ariaLabel={copy.search.propertyTypeLabel}
                value={propertyType}
                onChange={setPropertyType}
                isRtl={isRtl}
                options={[
                  { value: 'any', label: copy.search.anyPropertyType },
                  ...PROPERTY_TYPES.map((item) => ({ value: item.value, label: item[locale] }))
                ]}
              />
              <SearchSelect
                ariaLabel={copy.search.locationLabel}
                value={location}
                onChange={setLocation}
                isRtl={isRtl}
                options={[
                  { value: 'any', label: copy.search.anyLocation },
                  ...LOCATIONS.map((item) => ({ value: item.value, label: item[locale] }))
                ]}
              />
              <SearchSelect
                ariaLabel={copy.search.budgetLabel}
                value={maxPrice}
                onChange={setMaxPrice}
                isRtl={isRtl}
                options={[
                  { value: 'any', label: copy.search.anyBudget },
                  ...copy.search.priceBuckets.map((bucket) => ({ value: String(bucket.max), label: bucket.label }))
                ]}
              />
            </div>
            <button
              type="submit"
              className="btn-gold inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full px-7 text-sm font-semibold uppercase tracking-[0.14em]"
            >
              {copy.search.submit}
            </button>
          </div>
        </form>

        <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/[0.12] pt-6">
          {stats.map((item) => (
            <div key={item.label}>
              <dt className="label-caps text-white/55">{item.label}</dt>
              <dd className="font-display mt-2 text-2xl text-[#E2C774] [font-variant-numeric:lining-nums] sm:text-3xl">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function TrustStrip({ copy, isRtl }: { copy: SiteCopy['home']['trust']; isRtl: boolean }) {
  return (
    <SurfaceShell variant="dark" className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow={copy.eyebrow} title={copy.title} isRtl={isRtl} tone="dark" />
        <div className="mt-12 grid gap-x-10 gap-y-12 border-t border-white/10 pt-10 sm:grid-cols-2 xl:grid-cols-4">
          {copy.items.map((item) => (
            <article key={item.title}>
              <LineIcon icon={item.icon} gold />
              <h3 className="mt-5 text-lg font-medium text-[#F4F0E8]">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/65">{item.description}</p>
            </article>
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
  isRtl,
  viewDetailsLabel
}: {
  copy: SiteCopy['home']['featured'];
  properties: Property[];
  locale: 'en' | 'ar';
  isRtl: boolean;
  /** What each card's button says; the section's own "view all" is a different action. */
  viewDetailsLabel: string;
}) {
  return (
    <SurfaceShell variant="light" className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle eyebrow={copy.eyebrow} title={copy.title} isRtl={isRtl} tone="light" />
          <Link
            href="/properties"
            locale={locale}
            className="inline-flex items-center gap-2 self-start whitespace-nowrap pb-1 text-sm font-semibold text-[#231F20] underline decoration-[rgba(139,101,8,0.45)] decoration-1 underline-offset-[7px] transition hover:text-[#8B6508] sm:self-auto"
          >
            {copy.viewAllCta}
            <ArrowIcon rtl={isRtl} />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              locale={locale}
              isRtl={isRtl}
              viewDetailsLabel={viewDetailsLabel}
            />
          ))}
        </div>
      </div>
    </SurfaceShell>
  );
}

export function HomePartners({ copy, isRtl }: { copy: SiteCopy['home']['partners']; isRtl: boolean }) {
  return (
    <SurfaceShell variant="dark" className="py-16 sm:py-20">
      <PartnersMarquee eyebrow={copy.eyebrow} title={copy.title} isRtl={isRtl} />
    </SurfaceShell>
  );
}

export function RentalDeskPromo({
  copy,
  locale,
  isRtl
}: {
  copy: SiteCopy['home']['rentalDesk'];
  locale: 'en' | 'ar';
  isRtl: boolean;
}) {
  const cards = [
    { ...copy.brokerCard, icon: 'key' as const, href: '/rental-request' },
    { ...copy.ownerCard, icon: 'estate' as const, href: '/list-property' }
  ];

  return (
    <SurfaceShell variant="dark" className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow={copy.eyebrow} title={copy.title} intro={copy.subtitle} isRtl={isRtl} tone="dark" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {cards.map((card) => (
            <div
              key={card.title}
              className="flex flex-col rounded-[1.25rem] bg-white/[0.035] p-7 ring-1 ring-white/10 transition hover:ring-[rgba(217,179,85,0.35)] sm:p-9"
            >
              <LineIcon icon={card.icon} gold />
              <h3 className="mt-6 text-xl font-medium text-[#F4F0E8]">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/65">{card.body}</p>
              <Link
                href={card.href}
                locale={locale}
                className="mt-auto inline-flex items-center gap-2.5 self-start pt-7 text-sm font-semibold uppercase tracking-[0.12em] text-[#D9B355] transition hover:text-[#ECD08A]"
              >
                {card.cta}
                <ArrowIcon rtl={isRtl} />
              </Link>
            </div>
          ))}
        </div>
      </div>
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
    <SurfaceShell variant="spotlight" className="px-4 py-24 text-center sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="eyebrow text-[#D9B355]">{copy.eyebrow}</div>
        <h2 className="font-display mt-3 text-[2rem] leading-[1.15] text-[#F4F0E8] sm:text-[2.6rem]">{copy.title}</h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-white/70">{copy.subtitle}</p>
        <Link
          href="/contact"
          locale={locale}
          className="btn-gold mt-9 inline-flex h-12 items-center gap-3 rounded-full px-8 text-sm font-semibold uppercase tracking-[0.14em]"
        >
          {copy.cta}
          <ArrowIcon rtl={isRtl} />
        </Link>
      </div>
    </SurfaceShell>
  );
}
