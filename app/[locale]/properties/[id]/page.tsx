import type { Metadata } from 'next';
import { getSiteCopy } from '@/lib/site-content';
import { getProperty } from '@/lib/properties-store';
import { formatPrice } from '@/lib/format-price';
import { locationLabel, priceSuffixLabel, propertyTypeLabel, showsArea, unitTypeLabel } from '@/lib/property-taxonomy';
import { type Locale } from '@/i18n/routing';
import { PageShell } from '@/components/page-shell';
import { Link } from '@/i18n/navigation';
import { ArrowIcon, PhoneIcon, StatIcon } from '@/components/section-ui';
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
  const priceSuffix = priceSuffixLabel(property.propertyType, property.unitType);
  const descriptionBullets = descriptionItems(property.description);

  return (
    <PageShell locale={locale} copy={copy}>
      <div className="bg-[#E2E1D4] pb-24 pt-32 text-[#231F20] sm:pt-36">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
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

          <div className="mt-6 overflow-hidden rounded-[2rem] border border-[rgba(35,31,32,0.1)] bg-white shadow-[0_24px_64px_rgba(35,31,32,0.14)]">
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

            <div className="grid gap-8 p-8 lg:grid-cols-[1.3fr_1fr] sm:p-10">
              <div className={isRtl ? 'text-right' : ''}>
                <h1 className="text-3xl font-semibold tracking-[0.04em] text-[#231F20] sm:text-4xl">
                  {property.name}
                </h1>
                <p className="mt-3 text-sm uppercase tracking-[0.28em] text-[#58595B]">
                  {unitTypeLabel(property.unitType, locale)} · {locationLabel(property.location, locale)}
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

                <dl className="mt-8 divide-y divide-[rgba(35,31,32,0.08)] border-t border-[rgba(35,31,32,0.1)]">
                  {[
                    { label: copy.propertyDetail.typeLabel, value: propertyTypeLabel(property.propertyType, locale) },
                    { label: copy.propertyDetail.unitLabel, value: unitTypeLabel(property.unitType, locale) },
                    { label: copy.propertyDetail.locationLabel, value: locationLabel(property.location, locale) },
                    ...(property.bedrooms > 0
                      ? [{ label: copy.propertyDetail.bedroomsLabel, value: String(property.bedrooms) }]
                      : []),
                    ...(property.bathrooms > 0
                      ? [{ label: copy.propertyDetail.bathroomsLabel, value: String(property.bathrooms) }]
                      : []),
                    ...(propertyShowsArea
                      ? [{ label: copy.propertyDetail.areaLabel, value: formatArea(property.area, locale) }]
                      : [])
                  ].map((spec) => (
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

              <div className="flex flex-col justify-between gap-6 rounded-[1.6rem] bg-[#231F20] p-6 text-white sm:p-8">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-white/56">
                    {copy.propertyDetail.priceLabel}
                  </div>
                  <div className="mt-3">
                    <div className="gold-gradient-text text-3xl font-medium tracking-[0.06em]">
                      {formatPrice(property.price, locale)}
                    </div>
                    {priceSuffix ? (
                      <div className="mt-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                        {priceSuffix}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={enquireHref}
                    locale={locale}
                    className="btn-gold inline-flex flex-1 items-center justify-center gap-3 rounded-full px-6 py-3 text-sm font-medium uppercase tracking-[0.18em]"
                  >
                    {copy.propertyDetail.enquireCta}
                    <ArrowIcon rtl={isRtl} />
                  </Link>
                  <a
                    href={callHref}
                    className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-full border border-white/25 px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] text-white transition hover:border-[#D9B355] hover:text-[#D9B355]"
                  >
                    <PhoneIcon />
                    {copy.propertyDetail.callCta}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export const dynamic = 'force-dynamic';
