import type { Metadata } from 'next';
import { getSiteCopy } from '@/lib/site-content';
import { getProperty } from '@/lib/properties-store';
import { formatPrice } from '@/lib/format-price';
import { locationLabel, propertyTypeLabel, unitTypeLabel } from '@/lib/property-taxonomy';
import { type Locale } from '@/i18n/routing';
import { PageShell } from '@/components/page-shell';
import { Link } from '@/i18n/navigation';
import { ArrowIcon } from '@/components/section-ui';

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
            <div className="relative h-[26rem] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={property.image}
                alt={property.name}
                className={`h-full w-full object-cover object-center ${
                  property.tone === 'mono' ? 'grayscale contrast-110' : ''
                }`}
              />
              <div className="absolute left-6 top-6 rounded-full border border-white/20 bg-black/25 px-4 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.36em] text-white/90 backdrop-blur-sm">
                {propertyTypeLabel(property.propertyType, locale)}
              </div>
            </div>

            <div className="grid gap-8 p-8 lg:grid-cols-[1.3fr_1fr] sm:p-10">
              <div className={isRtl ? 'text-right' : ''}>
                <h1 className="text-3xl font-semibold tracking-[0.04em] text-[#231F20] sm:text-4xl">
                  {property.name}
                </h1>
                <p className="mt-3 text-sm uppercase tracking-[0.28em] text-[#58595B]">
                  {unitTypeLabel(property.unitType, locale)} · {locationLabel(property.location, locale)}
                </p>

                <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-[rgba(35,31,32,0.1)] pt-8 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.24em] text-[#58595B]">
                      {copy.propertyDetail.typeLabel}
                    </dt>
                    <dd className="mt-2 text-sm font-medium text-[#231F20]">
                      {propertyTypeLabel(property.propertyType, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.24em] text-[#58595B]">
                      {copy.propertyDetail.unitLabel}
                    </dt>
                    <dd className="mt-2 text-sm font-medium text-[#231F20]">
                      {unitTypeLabel(property.unitType, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.24em] text-[#58595B]">
                      {copy.propertyDetail.locationLabel}
                    </dt>
                    <dd className="mt-2 text-sm font-medium text-[#231F20]">
                      {locationLabel(property.location, locale)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-col justify-between gap-6 rounded-[1.6rem] bg-[#231F20] p-6 text-white sm:p-8">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-white/56">
                    {copy.propertyDetail.priceLabel}
                  </div>
                  <div className="gold-gradient-text mt-3 text-3xl font-medium tracking-[0.06em]">
                    {formatPrice(property.price, locale)}
                  </div>
                </div>
                <Link
                  href={enquireHref}
                  locale={locale}
                  className="btn-gold inline-flex items-center justify-center gap-3 rounded-full px-6 py-3 text-sm font-medium uppercase tracking-[0.18em]"
                >
                  {copy.propertyDetail.enquireCta}
                  <ArrowIcon rtl={isRtl} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export const dynamic = 'force-dynamic';
