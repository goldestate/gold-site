'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Property } from '@/lib/properties-store';
import type { SiteCopy } from '@/lib/site-content';
import { LOCATIONS, PROPERTY_TYPES, UNIT_TYPES } from '@/lib/property-taxonomy';
import { SectionTitle } from './section-ui';
import { PropertyCard } from './property-card';

export function PropertiesPageClient({
  copy,
  properties,
  locale,
  isRtl
}: {
  copy: SiteCopy['propertiesPage'];
  properties: Property[];
  locale: 'en' | 'ar';
  isRtl: boolean;
}) {
  const searchParams = useSearchParams();

  const [propertyType, setPropertyType] = useState(searchParams.get('type') ?? 'any');
  const [unitType, setUnitType] = useState(searchParams.get('unitType') ?? 'any');
  const [location, setLocation] = useState(searchParams.get('location') ?? 'any');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? 'any');

  const filtered = useMemo(
    () =>
      properties.filter((item) => {
        const matchesType = propertyType === 'any' || item.propertyType === propertyType;
        const matchesUnit = unitType === 'any' || item.unitType === unitType;
        const matchesLocation = location === 'any' || item.location === location;
        const matchesPrice = maxPrice === 'any' || item.price <= Number(maxPrice);
        return matchesType && matchesUnit && matchesLocation && matchesPrice;
      }),
    [properties, propertyType, unitType, location, maxPrice]
  );

  const selectClass =
    'w-full rounded-full border border-[rgba(35,31,32,0.15)] bg-white px-5 py-2.5 text-sm text-[#231F20] outline-none transition focus:border-[#B8860B] focus:ring-2 focus:ring-[rgba(184,134,11,0.18)] sm:w-auto';

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
      <SectionTitle eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} isRtl={isRtl} tone="light" />

      <div className={`mt-8 flex flex-wrap gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <label className="block">
          <span className="sr-only">{copy.filters.propertyTypeLabel}</span>
          <select
            value={propertyType}
            onChange={(event) => setPropertyType(event.target.value)}
            dir={isRtl ? 'rtl' : 'ltr'}
            className={selectClass}
          >
            <option value="any">{copy.filters.anyPropertyType}</option>
            {PROPERTY_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item[locale]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">{copy.filters.unitTypeLabel}</span>
          <select
            value={unitType}
            onChange={(event) => setUnitType(event.target.value)}
            dir={isRtl ? 'rtl' : 'ltr'}
            className={selectClass}
          >
            <option value="any">{copy.filters.anyUnitType}</option>
            {UNIT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item[locale]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">{copy.filters.locationLabel}</span>
          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            dir={isRtl ? 'rtl' : 'ltr'}
            className={selectClass}
          >
            <option value="any">{copy.filters.anyLocation}</option>
            {LOCATIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item[locale]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">{copy.filters.priceLabel}</span>
          <select
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            dir={isRtl ? 'rtl' : 'ltr'}
            className={selectClass}
          >
            <option value="any">{copy.filters.anyPrice}</option>
            {copy.filters.priceBuckets.map((bucket) => (
              <option key={bucket.max} value={bucket.max}>
                {bucket.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 rounded-[1.9rem] border border-[rgba(35,31,32,0.1)] bg-white/70 p-12 text-center">
          <p className="text-lg font-medium text-[#231F20]">{copy.filters.noResultsTitle}</p>
          <p className="mt-2 text-sm text-[rgba(35,31,32,0.68)]">{copy.filters.noResultsBody}</p>
        </div>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((property, index) => (
            <PropertyCard
              key={property.id}
              property={property}
              locale={locale}
              isRtl={isRtl}
              viewDetailsLabel={copy.filters.viewDetails}
              delay={(index % 3) * 0.06}
            />
          ))}
        </div>
      )}
    </div>
  );
}
