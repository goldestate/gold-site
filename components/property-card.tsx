'use client';

import { motion } from 'framer-motion';
import type { Property } from '@/lib/properties-store';
import { formatPrice } from '@/lib/format-price';
import { locationLabel, propertyTypeLabel, unitTypeLabel } from '@/lib/property-taxonomy';
import { fadeUp, ArrowIcon } from './section-ui';
import { Link } from '@/i18n/navigation';

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
      className="group overflow-hidden rounded-[1.9rem] border border-[rgba(35,31,32,0.1)] bg-white shadow-[0_18px_50px_rgba(35,31,32,0.12)] transition hover:-translate-y-1 hover:border-[rgba(184,134,11,0.35)] hover:shadow-[0_24px_68px_rgba(35,31,32,0.16)]"
    >
      <div className="relative h-72 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.image}
          alt={property.name}
          loading="lazy"
          className={`h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.04] ${
            property.tone === 'mono' ? 'grayscale contrast-110' : ''
          }`}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(35,31,32,0.05),rgba(35,31,32,0.56))]" />
        <div className="absolute left-6 top-6 rounded-full border border-white/20 bg-black/25 px-4 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.36em] text-white/90 backdrop-blur-sm">
          {propertyTypeLabel(property.propertyType, locale)}
        </div>
      </div>
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-2xl font-semibold tracking-[0.08em] text-[#231F20]">{property.name}</h3>
          <p className="mt-2 text-sm uppercase tracking-[0.24em] text-[#58595B]">
            {unitTypeLabel(property.unitType, locale)} · {locationLabel(property.location, locale)}
          </p>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[#58595B]">Price</div>
            <div className="mt-2 text-lg font-semibold tracking-[0.08em] text-[#231F20]">
              {formatPrice(property.price, locale)}
            </div>
          </div>
          <Link
            href={`/properties/${property.id}`}
            locale={locale}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(35,31,32,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#231F20] transition hover:border-[#B8860B] hover:text-[#B8860B]"
          >
            {viewDetailsLabel}
            <ArrowIcon rtl={isRtl} />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
