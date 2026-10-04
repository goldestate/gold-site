import type { Property } from '@/lib/properties-store';
import { formatPrice } from '@/lib/format-price';
import { locationLabel, priceSuffixLabel, propertyTypeLabel, showsArea, unitTypeLabel } from '@/lib/property-taxonomy';
import { ArrowIcon, StatIcon } from './section-ui';
import { Link } from '@/i18n/navigation';

function formatArea(area: number, locale: 'en' | 'ar'): string {
  const number = area.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US');
  return locale === 'ar' ? `${number} م²` : `${number} m²`;
}

/**
 * One listing in a grid. Photo first, at a size that sells a home on a phone
 * (one card per row there), then price, name and the facts. The "view details"
 * link stretches over the whole card, so a tap anywhere opens the listing while
 * keyboard users still land on one clear link.
 */
export function PropertyCard({
  property,
  locale,
  viewDetailsLabel
}: {
  property: Property;
  locale: 'en' | 'ar';
  isRtl: boolean;
  viewDetailsLabel: string;
  delay?: number;
}) {
  const propertyShowsArea = showsArea(property.propertyType) && property.area > 0;
  const priceSuffix = priceSuffixLabel(property.pricePeriod, locale);
  const isRtl = locale === 'ar';

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[1.15rem] bg-[#FBFAF6] shadow-[0_1px_0_rgba(35,31,32,0.04),0_18px_40px_-24px_rgba(35,31,32,0.45)] ring-1 ring-[rgba(35,31,32,0.07)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(35,31,32,0.04),0_26px_50px_-24px_rgba(35,31,32,0.55)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[rgba(35,31,32,0.06)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.images[0]}
          alt={property.name}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.03] ${
            property.tone === 'mono' ? 'grayscale contrast-110' : ''
          }`}
        />
        <span className="absolute start-3 top-3 rounded-full bg-[rgba(23,19,20,0.78)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F4F0E8] backdrop-blur-sm">
          {propertyTypeLabel(property.propertyType, locale)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-semibold text-[#8B6508] [font-variant-numeric:tabular-nums]">
            {formatPrice(property.price, locale)}
          </span>
          {priceSuffix ? (
            <span dir="ltr" className="text-sm font-medium text-[#58595B]">
              {priceSuffix}
            </span>
          ) : null}
        </div>

        <h3 className="font-display mt-2 truncate text-[1.2rem] leading-snug text-[#231F20]">{property.name}</h3>
        <p className="mt-1 truncate text-sm text-[#58595B]">
          {unitTypeLabel(property.unitType, locale)} · {locationLabel(property.location, locale)}
        </p>

        {property.bedrooms > 0 || property.bathrooms > 0 || propertyShowsArea ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-[rgba(35,31,32,0.08)] pt-3.5 text-sm text-[#231F20]">
            {property.bedrooms > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <StatIcon icon="bed" className="h-4 w-4 text-[#8B6508]" />
                {property.bedrooms}
              </span>
            ) : null}
            {property.bathrooms > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <StatIcon icon="bath" className="h-4 w-4 text-[#8B6508]" />
                {property.bathrooms}
              </span>
            ) : null}
            {propertyShowsArea ? (
              <span className="inline-flex items-center gap-1.5">
                <StatIcon icon="area" className="h-4 w-4 text-[#8B6508]" />
                {formatArea(property.area, locale)}
              </span>
            ) : null}
          </div>
        ) : null}

        <Link
          href={`/properties/${property.id}`}
          locale={locale}
          className="mt-auto inline-flex items-center gap-2 self-start pt-5 text-sm font-semibold text-[#231F20] transition after:absolute after:inset-0 after:content-[''] group-hover:text-[#8B6508]"
        >
          {viewDetailsLabel}
          <ArrowIcon rtl={isRtl} />
        </Link>
      </div>
    </article>
  );
}
