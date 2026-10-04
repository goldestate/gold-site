'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Property } from '@/lib/properties-store';
import type { SiteCopy } from '@/lib/site-content';
import { formatPrice } from '@/lib/format-price';
import {
  BATHROOM_OPTIONS,
  BEDROOM_OPTIONS,
  LOCATIONS,
  PROPERTY_TYPES,
  UNIT_TYPES
} from '@/lib/property-taxonomy';
import { SectionTitle, UnitTypeIcon, FunnelIcon } from './section-ui';
import { RangeSlider } from './range-slider';
import { PropertyCard } from './property-card';
import { GoldSelect } from './gold-select';

const PRICE_STEP = 500_000;
const AREA_STEP = 5;

function roundUpTo(value: number, step: number) {
  return Math.ceil(value / step) * step;
}

function Pill({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-[40px] min-w-[2.75rem] items-center justify-center rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.1em] transition active:scale-[0.97] ${
        active
          ? 'border-transparent bg-[#231F20] text-white'
          : 'border-[rgba(35,31,32,0.14)] bg-white text-[#231F20] hover:border-[#8B6508] hover:text-[#8B6508]'
      }`}
    >
      {children}
    </button>
  );
}

function FilterLabel({ children }: { children: ReactNode }) {
  return <div className="label-caps text-[#58595B]">{children}</div>;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 flex-none transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

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

  const priceBound = useMemo(() => {
    const dataMax = properties.reduce((max, item) => Math.max(max, item.price), 0);
    return Math.max(roundUpTo(dataMax * 1.1 || 0, 10_000_000), 100_000_000);
  }, [properties]);

  const areaBound = useMemo(() => {
    const dataMax = properties.reduce((max, item) => Math.max(max, item.area), 0);
    return Math.max(roundUpTo(dataMax * 1.1 || 0, 50), 500);
  }, [properties]);

  const initialMaxPrice = useMemo(() => {
    const fromQuery = Number(searchParams.get('maxPrice'));
    return Number.isFinite(fromQuery) && fromQuery > 0 ? Math.min(fromQuery, priceBound) : priceBound;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [propertyType, setPropertyType] = useState(searchParams.get('type') ?? 'any');
  const [unitType, setUnitType] = useState(searchParams.get('unitType') ?? 'any');
  const [location, setLocation] = useState(searchParams.get('location') ?? 'any');
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') ?? 'any');
  const [bathrooms, setBathrooms] = useState(searchParams.get('bathrooms') ?? 'any');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, initialMaxPrice]);
  const [areaRange, setAreaRange] = useState<[number, number]>([0, areaBound]);

  const resetFilters = () => {
    setPropertyType('any');
    setUnitType('any');
    setLocation('any');
    setBedrooms('any');
    setBathrooms('any');
    setPriceRange([0, priceBound]);
    setAreaRange([0, areaBound]);
  };

  const filtered = useMemo(
    () =>
      properties.filter((item) => {
        const matchesType = propertyType === 'any' || item.propertyType === propertyType;
        const matchesUnit = unitType === 'any' || item.unitType === unitType;
        const matchesLocation = location === 'any' || item.location === location;
        const matchesBedrooms = bedrooms === 'any' || item.bedrooms >= Number(bedrooms);
        const matchesBathrooms = bathrooms === 'any' || item.bathrooms >= Number(bathrooms);
        const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
        const matchesArea =
          propertyType === 'rental' || (item.area >= areaRange[0] && item.area <= areaRange[1]);
        return (
          matchesType &&
          matchesUnit &&
          matchesLocation &&
          matchesBedrooms &&
          matchesBathrooms &&
          matchesPrice &&
          matchesArea
        );
      }),
    [properties, propertyType, unitType, location, bedrooms, bathrooms, priceRange, areaRange]
  );

  const formatPriceLabel = (value: number) => {
    const label = formatPrice(value, locale);
    return value >= priceBound ? `${label}+` : label;
  };

  const formatAreaLabel = (value: number) => {
    const number = value.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US');
    const unit = locale === 'ar' ? 'م²' : 'm²';
    return value >= areaBound ? `${number}${unit}+` : `${number}${unit}`;
  };

  const selectClass =
    'w-full rounded-full border border-[rgba(35,31,32,0.15)] bg-white px-5 py-3 text-sm text-[#231F20] outline-none transition focus-visible:border-[#B8860B] focus-visible:ring-2 focus-visible:ring-[rgba(184,134,11,0.18)]';

  const resultsLabel = copy.filters.resultsCount.replace('{count}', String(filtered.length));

  return (
    // The light ground the cards and the dark-text title are drawn for. Without
    // it the page sat on the site's black, and the title could not be seen.
    <div className="bg-[#E2E1D4] text-[#231F20]">
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6 sm:pt-36 lg:px-8">
      <SectionTitle eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} isRtl={isRtl} tone="light" />

      <div className="mt-8 sm:mt-10">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          className="flex w-full items-center justify-between gap-3 rounded-full bg-[#FBFAF6] px-5 py-3.5 shadow-[0_12px_30px_-18px_rgba(35,31,32,0.45)] ring-1 ring-[rgba(35,31,32,0.08)] transition active:scale-[0.98] sm:hidden"
        >
          <span className="flex items-center gap-2.5">
            <FunnelIcon className="text-[#8B6508]" />
            <span className="text-sm font-semibold text-[#231F20]">{copy.filters.panelTitle}</span>
            <span className="rounded-full bg-[#231F20] px-2 py-0.5 text-[10px] font-bold text-white">
              {filtered.length}
            </span>
          </span>
          <ChevronIcon open={filtersOpen} />
        </button>

        <div
          className={`${filtersOpen ? 'mt-3 block' : 'hidden'} rounded-[1.5rem] bg-[#FBFAF6] p-5 text-start shadow-[0_24px_60px_-34px_rgba(35,31,32,0.5)] ring-1 ring-[rgba(35,31,32,0.07)] sm:mt-0 sm:block sm:rounded-[1.75rem] sm:p-9`}
        >
          <div className="flex items-center justify-between gap-3 sm:items-start">
            <div className="hidden sm:block">
              <h2 className="font-display text-2xl text-[#231F20]">{copy.filters.panelTitle}</h2>
              <p className="mt-1 text-sm text-[rgba(35,31,32,0.6)]">{copy.filters.panelSubtitle}</p>
            </div>
            <span className="text-sm font-semibold text-[#231F20] sm:hidden">{copy.filters.panelSubtitle}</span>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-[40px] flex-none items-center gap-2 rounded-full border border-[rgba(35,31,32,0.15)] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#231F20] transition hover:border-[#8B6508] hover:text-[#8B6508]"
            >
              {copy.filters.resetLabel}
            </button>
          </div>

          <div className="mt-5 space-y-5 sm:mt-8 sm:space-y-8">
          <div>
            <FilterLabel>{copy.filters.locationLabel}</FilterLabel>
            <GoldSelect
              label={copy.filters.locationLabel}
              value={location}
              onChange={setLocation}
              tone="light"
              isRtl={isRtl}
              className="mt-2.5 sm:mt-3"
              triggerClassName={selectClass}
              options={[
                { value: 'any', label: copy.filters.anyLocation },
                ...LOCATIONS.map((item) => ({ value: item.value, label: item[locale] }))
              ]}
            />
          </div>

          <div>
            <FilterLabel>{copy.filters.propertyTypeLabel}</FilterLabel>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill active={propertyType === 'any'} onClick={() => setPropertyType('any')}>
                {copy.filters.anyPropertyType}
              </Pill>
              {PROPERTY_TYPES.map((item) => (
                <Pill key={item.value} active={propertyType === item.value} onClick={() => setPropertyType(item.value)}>
                  {item[locale]}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <FilterLabel>{copy.filters.unitTypeLabel}</FilterLabel>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setUnitType('any')}
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.1em] transition active:scale-[0.97] ${
                  unitType === 'any'
                    ? 'border-transparent bg-[#231F20] text-white'
                    : 'border-[rgba(35,31,32,0.14)] bg-white text-[#231F20] hover:border-[#8B6508] hover:text-[#8B6508]'
                }`}
              >
                {copy.filters.anyUnitType}
              </button>
              {UNIT_TYPES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setUnitType(item.value)}
                  className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.1em] transition active:scale-[0.97] ${
                    unitType === item.value
                      ? 'border-transparent bg-[#231F20] text-white'
                      : 'border-[rgba(35,31,32,0.14)] bg-white text-[#231F20] hover:border-[#8B6508] hover:text-[#8B6508]'
                  }`}
                >
                  <UnitTypeIcon type={item.value} className="h-4 w-4" />
                  {item[locale]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 sm:gap-8">
            <div>
              <FilterLabel>{copy.filters.bedroomsLabel}</FilterLabel>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill active={bedrooms === 'any'} onClick={() => setBedrooms('any')}>
                  {copy.filters.anyCount}
                </Pill>
                {BEDROOM_OPTIONS.map((count) => (
                  <Pill key={count} active={bedrooms === String(count)} onClick={() => setBedrooms(String(count))}>
                    {count}
                  </Pill>
                ))}
              </div>
            </div>
            <div>
              <FilterLabel>{copy.filters.bathroomsLabel}</FilterLabel>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill active={bathrooms === 'any'} onClick={() => setBathrooms('any')}>
                  {copy.filters.anyCount}
                </Pill>
                {BATHROOM_OPTIONS.map((count) => (
                  <Pill key={count} active={bathrooms === String(count)} onClick={() => setBathrooms(String(count))}>
                    {count}
                  </Pill>
                ))}
              </div>
            </div>
          </div>

          <div
            className={`grid gap-5 border-t border-[rgba(35,31,32,0.08)] pt-5 sm:gap-8 sm:pt-8 ${
              propertyType === 'rental' ? 'sm:grid-cols-1' : 'sm:grid-cols-2'
            }`}
          >
            {propertyType !== 'rental' && (
              <div>
                <FilterLabel>{copy.filters.areaLabel}</FilterLabel>
                <p className="mt-1 text-xs text-[rgba(35,31,32,0.55)]">{copy.filters.areaHint}</p>
                <div className="mt-4 sm:mt-5">
                  <RangeSlider
                    min={0}
                    max={areaBound}
                    step={AREA_STEP}
                    value={areaRange}
                    onChange={setAreaRange}
                    formatValue={formatAreaLabel}
                    ariaLabelMin={`${copy.filters.areaLabel} min`}
                    ariaLabelMax={`${copy.filters.areaLabel} max`}
                  />
                </div>
              </div>
            )}
            <div>
              <FilterLabel>{copy.filters.priceLabel}</FilterLabel>
              <p className="mt-1 text-xs text-[rgba(35,31,32,0.55)]">{copy.filters.priceHint}</p>
              <div className="mt-4 sm:mt-5">
                <RangeSlider
                  min={0}
                  max={priceBound}
                  step={PRICE_STEP}
                  value={priceRange}
                  onChange={setPriceRange}
                  formatValue={formatPriceLabel}
                  ariaLabelMin={`${copy.filters.priceLabel} min`}
                  ariaLabelMax={`${copy.filters.priceLabel} max`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className="label-caps mt-8 hidden text-[#58595B] sm:block">{resultsLabel}</div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-[1.75rem] bg-[#FBFAF6] p-12 text-center ring-1 ring-[rgba(35,31,32,0.07)]">
          <p className="font-display text-2xl text-[#231F20]">{copy.filters.noResultsTitle}</p>
          <p className="mt-2 text-sm text-[rgba(35,31,32,0.68)]">{copy.filters.noResultsBody}</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-6 sm:mt-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              locale={locale}
              isRtl={isRtl}
              viewDetailsLabel={copy.filters.viewDetails}
            />
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
