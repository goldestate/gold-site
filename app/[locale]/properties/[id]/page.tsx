import type { Metadata } from 'next';
import { SITE_URL, getSiteCopy } from '@/lib/site-content';
import { getProperty, type Property } from '@/lib/properties-store';
import type { SiteCopy } from '@/lib/site-content';
import { formatPrice } from '@/lib/format-price';
import { goldWhatsAppUrl } from '@/lib/app-links';
import { locationLabel, priceSuffixLabel, propertyTypeLabel, showsArea, unitTypeLabel } from '@/lib/property-taxonomy';
import { type Locale } from '@/i18n/routing';
import { PageShell } from '@/components/page-shell';
import { Link } from '@/i18n/navigation';
import { ArrowIcon, PhoneIcon, StatIcon, SurfaceShell, WhatsAppIcon } from '@/components/section-ui';
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

/** Fills "{key}" slots in a copy string. Split and join, so a "$" in a listing name is just a "$". */
function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.split(`{${key}}`).join(value), template);
}

/**
 * WhatsApp leads, because it is where people here actually ask about a unit;
 * the enquiry form and the phone stay for whoever prefers them. Capitals and
 * letter-spacing are for the Latin labels only: spacing Arabic letters apart
 * breaks the joins between them.
 */
function PriceCard({
  copy,
  property,
  locale,
  isRtl,
  priceSuffix,
  whatsappHref,
  enquireHref,
  callHref
}: {
  copy: SiteCopy;
  property: Property;
  locale: 'en' | 'ar';
  isRtl: boolean;
  priceSuffix: string;
  whatsappHref: string;
  enquireHref: string;
  callHref: string;
}) {
  const label = isRtl ? 'text-base' : 'text-sm uppercase tracking-[0.14em]';
  const outline = `inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-full border border-white/20 px-6 font-medium text-white transition hover:border-[#D9B355] hover:text-[#D9B355] ${label}`;

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-[#1B1718] p-6 text-white shadow-[0_30px_60px_-30px_rgba(23,19,20,0.7)] ring-1 ring-white/5 sm:p-8">
      <GMark tone="gold" size={300} className="-bottom-16 -end-16 opacity-[0.06]" />
      <div className="relative">
        <div className="eyebrow text-[#D9B355]">{copy.propertyDetail.priceLabel}</div>
        <div className="font-display mt-2 text-[2.1rem] leading-tight text-[#E2C774] [font-variant-numeric:lining-nums] sm:text-[2.4rem]">
          {formatPrice(property.price, locale)}
        </div>
        {priceSuffix ? (
          <div dir="ltr" className={`label-caps mt-1 text-white/50 ${isRtl ? 'text-right' : ''}`}>
            {priceSuffix}
          </div>
        ) : null}
        <div className="mt-7 flex flex-col gap-3">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn-gold inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-full px-6 font-semibold ${label}`}
          >
            <WhatsAppIcon className="h-[1.1rem] w-[1.1rem]" />
            {copy.propertyDetail.whatsappCta}
          </a>
          <Link href={enquireHref} locale={locale} className={outline}>
            {copy.propertyDetail.enquireCta}
            <ArrowIcon rtl={isRtl} />
          </Link>
          <a href={callHref} className={outline}>
            <PhoneIcon />
            {copy.propertyDetail.callCta}
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * On phones the price box scrolls away with the page, so the two quickest ways
 * to ask about the unit stay pinned to the bottom of the screen.
 */
function PhoneContactBar({
  copy,
  property,
  locale,
  priceSuffix,
  whatsappHref,
  callHref
}: {
  copy: SiteCopy;
  property: Property;
  locale: 'en' | 'ar';
  priceSuffix: string;
  whatsappHref: string;
  callHref: string;
}) {
  const isRtl = locale === 'ar';

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(23,19,20,0.96)] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-14px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="gold-gradient-text truncate text-lg font-medium tracking-[0.02em]">
            {formatPrice(property.price, locale)}
          </div>
          {priceSuffix ? (
            <div
              dir="ltr"
              className={`text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50 ${isRtl ? 'text-right' : ''}`}
            >
              {priceSuffix}
            </div>
          ) : null}
        </div>
        <a
          href={callHref}
          aria-label={copy.propertyDetail.callCta}
          className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-full border border-white/25 text-white transition hover:border-[#D9B355] hover:text-[#D9B355]"
        >
          <PhoneIcon className="h-5 w-5" />
        </a>
        {/* On the narrowest phones the word goes and the glyph stays, so the price never gets cut off. */}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={copy.propertyDetail.whatsappCta}
          className={`btn-gold inline-flex h-12 flex-none items-center justify-center gap-2 rounded-full px-4 font-semibold max-[359px]:w-12 max-[359px]:px-0 ${
            isRtl ? 'text-base' : 'text-sm uppercase tracking-[0.08em]'
          }`}
        >
          <WhatsAppIcon className="h-5 w-5" />
          <span className="max-[359px]:hidden">{copy.contact.whatsappLabel}</span>
        </a>
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
          <p className="mt-3 text-white/[0.68]">{copy.propertyDetail.notFoundBody}</p>
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
  const priceSuffix = priceSuffixLabel(property.pricePeriod, locale);
  const descriptionBullets = descriptionItems(property.description);
  const whatsappHref = goldWhatsAppUrl(
    fill(copy.propertyDetail.whatsappMessage, {
      property: property.name,
      location: locationLabel(property.location, locale),
      price: `${formatPrice(property.price, locale)}${priceSuffix}`,
      url: `${SITE_URL}/${locale}/properties/${property.id}`
    })
  );

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
    <PageShell
      locale={locale}
      copy={copy}
      bottomBar={
        <PhoneContactBar
          copy={copy}
          property={property}
          locale={locale}
          priceSuffix={priceSuffix}
          whatsappHref={whatsappHref}
          callHref={callHref}
        />
      }
    >
      <SurfaceShell variant="light" className="px-4 pb-24 pt-32 sm:px-6 sm:pt-36 lg:px-8">
        <div className="relative mx-auto max-w-6xl">
          <Link
            href="/properties"
            locale={locale}
            className="label-caps inline-flex items-center gap-2 text-[#58595B] transition hover:text-[#8B6508]"
          >
            <ArrowIcon rtl={!isRtl} />
            {copy.propertyDetail.backToListings}
          </Link>

          <div className="relative mt-6 overflow-hidden rounded-[1.5rem] shadow-[0_30px_60px_-30px_rgba(35,31,32,0.5)]">
            <PropertyGallery
              images={property.images}
              alt={property.name}
              mono={property.tone === 'mono'}
              badge={
                <div className="absolute left-5 top-5 rounded-full bg-[rgba(23,19,20,0.7)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F4F0E8] backdrop-blur-sm">
                  {propertyTypeLabel(property.propertyType, locale)}
                </div>
              }
            />
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="text-start">
              <div className="eyebrow text-[#8B6508]">{unitTypeLabel(property.unitType, locale)}</div>
              <h1 className="font-display mt-2 text-[2.2rem] leading-[1.1] text-[#231F20] sm:text-[2.8rem]">
                {property.name}
              </h1>
              <p className="mt-3 text-base text-[#58595B]">{locationLabel(property.location, locale)}</p>

              {property.bedrooms > 0 || property.bathrooms > 0 || propertyShowsArea ? (
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-[#231F20]">
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
                  whatsappHref={whatsappHref}
                  enquireHref={enquireHref}
                  callHref={callHref}
                />
              </div>

              <dl className="mt-8 divide-y divide-[rgba(35,31,32,0.1)] border-t border-[rgba(35,31,32,0.1)]">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex items-center justify-between gap-4 py-3.5">
                    <dt className="label-caps text-[#58595B]">{spec.label}</dt>
                    <dd className="text-sm font-medium text-[#231F20]">{spec.value}</dd>
                  </div>
                ))}
              </dl>

              {property.description ? (
                <div className="mt-8 border-t border-[rgba(35,31,32,0.1)] pt-8">
                  <h2 className="font-display text-2xl text-[#231F20]">{copy.propertyDetail.descriptionLabel}</h2>
                  {descriptionBullets ? (
                    <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                      {descriptionBullets.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2.5 text-[0.95rem] leading-6 text-[rgba(35,31,32,0.8)]"
                        >
                          <span className="mt-[0.5rem] h-1.5 w-1.5 flex-none rounded-full bg-[#8B6508]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 max-w-2xl text-[0.95rem] leading-8 text-[rgba(35,31,32,0.8)]">{property.description}</p>
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
                whatsappHref={whatsappHref}
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
