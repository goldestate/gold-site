'use client';

import { motion } from 'framer-motion';
import type { Property } from '@/lib/properties-store';
import { formatPrice } from '@/lib/format-price';
import { locationLabel, priceSuffixLabel, propertyTypeLabel, showsArea, unitTypeLabel } from '@/lib/property-taxonomy';
import { fadeUp, ArrowIcon, StatIcon } from './section-ui';
import { Link } from '@/i18n/navigation';

function formatArea(area: number, locale: 'en' | 'ar'): string {
  const number = area.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US');
  return locale === 'ar' ? `${number} م²` : `${number} m²`;
}

export function PropertyCard({
  property,
  locale,
  isRtl,
  viewDetailsLabel,
  delay = 0
}: {
  property: Property;
  locale: 'en' | 'ar';
  isRtl: boolean;
  viewDetailsLabel: string;
  delay?: number;
}) {
  const propertyShowsArea = showsArea(property.propertyType) && property.area > 0;
  const priceSuffix = priceSuffixLabel(property.propertyType);

  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-120px' }}
      transition={{ duration: 0.7, delay }}
      className="group overflow-hidden rounded-[0.85rem] border border-[rgba(35,31,32,0.1)] bg-white transition hover:border-[rgba(184,134,11,0.4)] hover:shadow-[0_10px_24px_rgba(35,31,32,0.1)] sm:rounded-[1rem]"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.images[0]}
          alt={property.name}
          loading="lazy"
          className={`h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.04] ${
            property.tone === 'mono' ? 'grayscale contrast-110' : ''
          }`}
        />
        <div className="absolute left-2 top-2 rounded-full bg-[#231F20]/85 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-white sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.18em]">
          {propertyTypeLabel(property.propertyType, locale)}
        </div>
      </div>

      <div className="p-2.5 sm:p-3.5">
        <span className={`flex items-baseline gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <span className="text-sm font-bold tracking-[0.01em] text-[#B8860B] sm:text-lg">
            {formatPrice(property.price, locale)}
          </span>
          {priceSuffix ? (
            <span dir="ltr" className="text-[9px] font-medium text-[#58595B] sm:text-[11px]">
              {priceSuffix}
            </span>
          ) : null}
        </span>

        <h3 className="mt-1 truncate text-xs font-semibold tracking-[0.01em] text-[#231F20] sm:mt-1.5 sm:text-sm">
          {property.name}
        </h3>

        <p className="mt-0.5 truncate text-[9px] uppercase tracking-[0.1em] text-[#58595B] sm:text-[10px] sm:tracking-[0.16em]">
          {unitTypeLabel(property.unitType, locale)} · {locationLabel(property.location, locale)}
        </p>

        {property.bedrooms > 0 || property.bathrooms > 0 || propertyShowsArea ? (
          <div
            className={`mt-1.5 flex items-center gap-x-2.5 gap-y-1 border-t border-[rgba(35,31,32,0.08)] pt-1.5 text-[10px] text-[#231F20] sm:mt-2 sm:gap-x-3.5 sm:pt-2 sm:text-xs ${
              isRtl ? 'flex-row-reverse' : ''
            }`}
          >
            {property.bedrooms > 0 ? (
              <span className="inline-flex items-center gap-1">
                <StatIcon icon="bed" className="h-3 w-3 text-[#B8860B] sm:h-3.5 sm:w-3.5" />
                {property.bedrooms}
              </span>
            ) : null}
            {property.bathrooms > 0 ? (
              <span className="inline-flex items-center gap-1">
                <StatIcon icon="bath" className="h-3 w-3 text-[#B8860B] sm:h-3.5 sm:w-3.5" />
                {property.bathrooms}
              </span>
            ) : null}
            {propertyShowsArea ? (
              <span className="inline-flex items-center gap-1">
                <StatIcon icon="area" className="h-3 w-3 text-[#B8860B] sm:h-3.5 sm:w-3.5" />
                {formatArea(property.area, locale)}
              </span>
            ) : null}
          </div>
        ) : null}

        <Link
          href={`/properties/${property.id}`}
          locale={locale}
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[rgba(35,31,32,0.16)] py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#231F20] transition group-hover:border-[#B8860B] group-hover:text-[#B8860B] sm:mt-2.5 sm:py-2 sm:text-[10px] sm:tracking-[0.16em]"
        >
          {viewDetailsLabel}
          <ArrowIcon rtl={isRtl} />
        </Link>
      </div>
    </motion.article>
  );
}
