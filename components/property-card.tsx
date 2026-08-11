'use client';

import { motion } from 'framer-motion';
import type { Property } from '@/lib/properties-store';
import { formatPrice } from '@/lib/format-price';
import { locationLabel, propertyTypeLabel, unitTypeLabel } from '@/lib/property-taxonomy';
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
  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-120px' }}
      transition={{ duration: 0.7, delay }}
      className="group overflow-hidden rounded-2xl border border-[rgba(35,31,32,0.1)] bg-white shadow-[0_8px_24px_rgba(35,31,32,0.08)] transition hover:-translate-y-1 hover:border-[rgba(184,134,11,0.35)] hover:shadow-[0_16px_36px_rgba(35,31,32,0.14)] sm:rounded-[1.5rem]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.image}
          alt={property.name}
          loading="lazy"
          className={`h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.04] ${
            property.tone === 'mono' ? 'grayscale contrast-110' : ''
          }`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(35,31,32,0.02),rgba(35,31,32,0.32))]" />
        <div className="absolute left-2 top-2 rounded-full border border-white/20 bg-black/30 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.2em]">
          {propertyTypeLabel(property.propertyType, locale)}
        </div>
      </div>
      <div className="space-y-2 p-2.5 sm:space-y-3 sm:p-4">
        <div className={`flex items-start justify-between gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <h3 className="min-w-0 flex-1 truncate text-xs font-semibold tracking-[0.01em] text-[#231F20] sm:text-base">
            {property.name}
          </h3>
          <span className="flex-none text-xs font-bold text-[#B8860B] sm:text-sm">
            {formatPrice(property.price, locale)}
          </span>
        </div>

        <p className="truncate text-[10px] uppercase tracking-[0.14em] text-[#58595B] sm:text-xs sm:tracking-[0.22em]">
          {unitTypeLabel(property.unitType, locale)} · {locationLabel(property.location, locale)}
        </p>

        {property.bedrooms > 0 || property.bathrooms > 0 || property.area > 0 ? (
          <div
            className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-[rgba(35,31,32,0.08)] pt-2 text-[10px] text-[#231F20] sm:gap-x-4 sm:pt-3 sm:text-sm ${
              isRtl ? 'flex-row-reverse' : ''
            }`}
          >
            {property.bedrooms > 0 ? (
              <span className="inline-flex items-center gap-1 sm:gap-1.5">
                <StatIcon icon="bed" className="h-3 w-3 text-[#B8860B] sm:h-4 sm:w-4" />
                {property.bedrooms}
              </span>
            ) : null}
            {property.bathrooms > 0 ? (
              <span className="inline-flex items-center gap-1 sm:gap-1.5">
                <StatIcon icon="bath" className="h-3 w-3 text-[#B8860B] sm:h-4 sm:w-4" />
                {property.bathrooms}
              </span>
            ) : null}
            {property.area > 0 ? (
              <span className="inline-flex items-center gap-1 sm:gap-1.5">
                <StatIcon icon="area" className="h-3 w-3 text-[#B8860B] sm:h-4 sm:w-4" />
                {formatArea(property.area, locale)}
              </span>
            ) : null}
          </div>
        ) : null}

        <Link
          href={`/properties/${property.id}`}
          locale={locale}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[rgba(35,31,32,0.12)] py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#231F20] transition hover:border-[#B8860B] hover:text-[#B8860B] sm:gap-2 sm:py-2 sm:text-[11px] sm:tracking-[0.2em]"
        >
          {viewDetailsLabel}
          <ArrowIcon rtl={isRtl} />
        </Link>
      </div>
    </motion.article>
  );
}
