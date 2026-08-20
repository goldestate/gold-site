import type { Metadata } from 'next';
import { getSiteCopy } from '@/lib/site-content';
import { getProperty, type Property } from '@/lib/properties-store';
import type { SiteCopy } from '@/lib/site-content';
import { formatPrice } from '@/lib/format-price';
import { locationLabel, priceSuffixLabel, propertyTypeLabel, showsArea, unitTypeLabel } from '@/lib/property-taxonomy';
import { type Locale } from '@/i18n/routing';
import { PageShell } from '@/components/page-shell';
import { Link } from '@/i18n/navigation';
import { ArrowIcon, PhoneIcon, StatIcon, SurfaceShell } from '@/components/section-ui';
import { GMark } from '@/components/gmark';
import { PropertyGallery } from '@/components/property-gallery';

function formatArea(area: number, locale: 'en' | 'ar'): string {
  const number = area.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US');
  return locale === 'ar' ? `${number} م²` : `${number} m²`;
}

/** Descriptions typed as "- item - item - item" (with or without line breaks) render as a bullet list instead of a run-on paragraph. */
function descriptionItems(description: string): string[] | null {
  const trimmed = description.trim();
  if (!/^-\s/.test(trimmed)) return null;
  const items = trimmed
    .split(/\s-\s+/)
    .map((item) => item.replace(/^-\s*/, '').trim())
    .filter(Boolean);
  return items.length > 1 ? items : null;
}

function PriceCard({
  copy,
  property,
  locale,
  isRtl,
  priceSuffix,
  enquireHref,
  callHref
}: {
  copy: SiteCopy;
  property: Property;
  locale: 'en' | 'ar';
  isRtl: boolean;
  priceSuffix: string;
  enquireHref: string;
  callHref: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-[#231F20] p-6 text-white shadow-[0_20px_50px_rgba(35,31,32,0.22)] sm:p-7">
      <GMark tone="gold" size={300} className={`-bottom-16 opacity-[0.07] ${isRtl ? '-left-16 scale-x-[-1]' : '-right-16'}`} />
      <div className="relative">
        <div className="font-serif text-xs uppercase tracking-[0.32em] text-[rgba(217,179,85,0.88)]">
          {copy.propertyDetail.priceLabel}
        </div>
        <div className="gold-gradient-text mt-3 text-3xl font-medium tracking-[0.04em] sm:text-[2.1rem]">
          {formatPrice(property.price, locale)}
        </div>
        {priceSuffix ? (
          <div
            dir="ltr"
            className={`mt-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/50 ${isRtl ? 'text-right' : ''}`}
          >
            {priceSuffix}
          </div>
        ) : null}
        <div className="mt-7 flex flex-col gap-3">
          <Link
            href={enquireHref}
            locale={locale}
            className="btn-gold inline-flex items-center justify-center gap-3 rounded-full px-6 py-3.5 text-sm font-medium uppercase tracking-[0.18em]"
          >
            {copy.propertyDetail.enquireCta}
            <ArrowIcon rtl={isRtl} />
          </Link>
          <a
            href={callHref}
            className="inline-flex items-center justify-center gap-2.5 rounded-full border border-white/25 px-6 py-3.5 text-sm font-medium uppercase tracking-[0.18em] text-white transition hover:border-[#D9B355] hover:text-[#D9B355]"
          >
            <PhoneIcon />
            {copy.propertyDetail.callCta}
          </a>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params
}: {
  params: { locale: Locale; id: string };
}): Promise<Metadata> {
  const property = await getProperty(params.id);
  const copy = getSiteCopy(params.locale);
  if (!property || !property.published) {
    return { title: `${copy.propertyDetail.notFoundTitle} — ${copy.seo.title}` };
  }
  return { title: `${property.name} — ${copy.seo.title}` };
}

export default async function PropertyDetailPage({
  params
}: {
  params: { locale: Locale; id: string };
}) {
  const { locale, id } = params;
  const copy = getSiteCopy(locale);
  const isRtl = locale === 'ar';
  const property = await getProperty(id);

  if (!property || !property.published) {
    return (
      <PageShell locale={locale} copy={copy}>
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-40 text-center sm:px-6 lg:px-8">
          <p className="text-2xl font-medium text-white">{copy.propertyDetail.notFoundTitle}</p>
          <p className="mt-3 text-white/68">{copy.propertyDetail.notFoundBody}</p>
          <Link
            href="/properties"
            locale={locale}
            className="btn-gold mt-8 inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm font-medium uppercase tracking-[0.2em]"
          >
            {copy.propertyDetail.backToListings}
            <ArrowIcon rtl={isRtl} />
          </Link>
        </div>
      </PageShell>
    );
  }

  const enquireHref = `/contact?interest=${encodeURIComponent(property.name)}`;
  const callHref = `tel:${copy.contact.hotline.replace(/[^+\d]/g, '')}`;
  const propertyShowsArea = showsArea(property.propertyType) && property.area > 0;
  const priceSuffix = priceSuffixLabel(property.propertyType);
  const descriptionBullets = descriptionItems(property.description);

  const specs = [
    { label: copy.propertyDetail.typeLabel, value: propertyTypeLabel(property.propertyType, locale) },
    { label: copy.propertyDetail.unitLabel, value: unitTypeLabel(property.unitType, locale) },
    { label: copy.propertyDetail.locationLabel, value: locationLabel(property.location, locale) },
    ...(property.bedrooms > 0
      ? [{ label: copy.propertyDetail.bedroomsLabel, value: String(property.bedrooms) }]
      : []),
    ...(property.bathrooms > 0
      ? [{ label: copy.propertyDetail.bathroomsLabel, value: String(property.bathrooms) }]
      : []),
    ...(propertyShowsArea ? [{ label: copy.propertyDetail.areaLabel, value: formatArea(property.area, locale) }] : [])
  ];

  return (
    <PageShell locale={locale} copy={copy}>
      <SurfaceShell variant="light" className="px-4 pb-24 pt-32 sm:px-6 sm:pt-36 lg:px-8">
        <div className="relative mx-auto max-w-6xl">
          <Link
            href="/properties"
            locale={locale}
            className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#58595B] transition hover:text-[#B8860B] ${
              isRtl ? 'flex-row-reverse' : ''
            }`}
          >
            <ArrowIcon rtl={!isRtl} />
            {copy.propertyDetail.backToListings}
          </Link>

          <div className="relative mt-6 overflow-hidden rounded-[1.75rem] shadow-[0_20px_50px_rgba(35,31,32,0.16)]">
            <PropertyGallery
              images={property.images}
              alt={property.name}
              mono={property.tone === 'mono'}
              badge={
                <div className="absolute left-6 top-6 rounded-full border border-white/20 bg-black/25 px-4 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.36em] text-white/90 backdrop-blur-sm">
                  {propertyTypeLabel(property.propertyType, locale)}
                </div>
              }
            />
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className={isRtl ? 'text-right' : ''}>
              <div className="font-serif text-xs uppercase tracking-[0.36em] text-[rgba(184,134,11,0.88)]">
                {unitTypeLabel(property.unitType, locale)}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-[0.04em] text-[#231F20] sm:text-4xl">
                {property.name}
              </h1>
              <p className="mt-3 text-sm uppercase tracking-[0.28em] text-[#58595B]">
                {locationLabel(property.location, locale)}
              </p>

              {property.bedrooms > 0 || property.bathrooms > 0 || propertyShowsArea ? (
                <div
                  className={`mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-[#231F20] ${
                    isRtl ? 'flex-row-reverse' : ''
                  }`}
                >
                  {property.bedrooms > 0 ? (
                    <span className="inline-flex items-center gap-2">
                      <StatIcon icon="bed" className="text-[#B8860B]" />
                      {property.bedrooms} {copy.propertyDetail.bedroomsLabel}
                    </span>
                  ) : null}
                  {property.bathrooms > 0 ? (
                    <span className="inline-flex items-center gap-2">
                      <StatIcon icon="bath" className="text-[#B8860B]" />
                      {property.bathrooms} {copy.propertyDetail.bathroomsLabel}
                    </span>
                  ) : null}
                  {propertyShowsArea ? (
                    <span className="inline-flex items-center gap-2">
                      <StatIcon icon="area" className="text-[#B8860B]" />
                      {formatArea(property.area, locale)}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-8 lg:hidden">
                <PriceCard
                  copy={copy}
                  property={property}
                  locale={locale}
                  isRtl={isRtl}
                  priceSuffix={priceSuffix}
                  enquireHref={enquireHref}
                  callHref={callHref}
                />
              </div>

              <dl className="mt-8 divide-y divide-[rgba(35,31,32,0.1)] border-t border-[rgba(35,31,32,0.1)]">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className={`flex items-center justify-between gap-4 py-3.5 ${isRtl ? 'flex-row-reverse' : ''}`}
                  >
                    <dt className="text-xs uppercase tracking-[0.24em] text-[#58595B]">{spec.label}</dt>
                    <dd className="text-sm font-medium text-[#231F20]">{spec.value}</dd>
                  </div>
                ))}
              </dl>

              {property.description ? (
                <div className="mt-8 border-t border-[rgba(35,31,32,0.1)] pt-8">
                  <h2 className="text-xs uppercase tracking-[0.24em] text-[#58595B]">
                    {copy.propertyDetail.descriptionLabel}
                  </h2>
                  {descriptionBullets ? (
                    <ul className={`mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 ${isRtl ? 'text-right' : ''}`}>
                      {descriptionBullets.map((item, index) => (
                        <li
                          key={index}
                          className={`flex items-start gap-2.5 text-sm leading-6 text-[rgba(35,31,32,0.78)] ${
                            isRtl ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <span className="mt-[0.45rem] h-1.5 w-1.5 flex-none rounded-full bg-[#B8860B]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm leading-7 text-[rgba(35,31,32,0.78)]">{property.description}</p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="hidden lg:sticky lg:top-28 lg:block">
              <PriceCard
                copy={copy}
                property={property}
                locale={locale}
                isRtl={isRtl}
                priceSuffix={priceSuffix}
                enquireHref={enquireHref}
                callHref={callHref}
              />
            </div>
          </div>
        </div>
      </SurfaceShell>
    </PageShell>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
