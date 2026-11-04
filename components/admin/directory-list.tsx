'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { LOCATIONS, locationLabel, type LocationValue } from '@/lib/property-taxonomy';
import {
  ALL,
  FilterChips,
  FilterSearch,
  FilterSelect,
  FilterSummary,
  countOptions,
  matchesSearch,
  useStoredState
} from './list-filters';

/** One compound as the index shows it, already counted on the server. */
export type DirectoryListItem = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  matchNames: string[];
  location: LocationValue;
  active: boolean;
  hasPin: boolean;
  placeCount: number;
  filled: number;
  liveCodes: number;
  unlocked: number;
};

type DirectoryFilters = { search: string; location: string; status: string };
const NO_FILTERS: DirectoryFilters = { search: '', location: ALL, status: ALL };

const STATUS_OPTIONS = [
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'gaps', label: 'Missing categories' },
  { value: 'no-codes', label: 'No codes' }
];

function matchesStatus(item: DirectoryListItem, status: string, total: number): boolean {
  switch (status) {
    case 'visible':
      return item.active;
    case 'hidden':
      return !item.active;
    case 'gaps':
      return item.filled < total;
    case 'no-codes':
      return item.liveCodes === 0;
    default:
      return true;
  }
}

export function DirectoryList({ items, total }: { items: DirectoryListItem[]; total: number }) {
  const [filters, setFilters] = useStoredState<DirectoryFilters>('gold-admin:directory-filters', NO_FILTERS);
  const set = (patch: Partial<DirectoryFilters>) => setFilters({ ...filters, ...patch });

  const locationOptions = countOptions(
    items,
    LOCATIONS.map((item) => ({ value: item.value, label: item.en })),
    (item) => item.location
  );
  // A compound can be in more than one of these at once, so each is counted on its own.
  const statusOptions = STATUS_OPTIONS.map((option) => ({
    ...option,
    count: items.filter((item) => matchesStatus(item, option.value, total)).length
  }));

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (!filters.location || item.location === filters.location) &&
          matchesStatus(item, filters.status, total) &&
          matchesSearch(
            filters.search,
            [item.nameEn, item.nameAr, item.slug, locationLabel(item.location, 'en'), ...item.matchNames].join(' ')
          )
      ),
    [items, filters, total]
  );

  const filtering = Boolean(filters.search || filters.location || filters.status);

  if (items.length === 0) {
    return (
      <p className="mt-6 rounded-[1rem] border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/50">
        No compounds yet. Add your first one below.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
        <FilterSearch value={filters.search} onChange={(value) => set({ search: value })} placeholder="Search compounds" />
        <FilterChips label="Location" options={locationOptions} value={filters.location} onChange={(value) => set({ location: value })} />
        <div className="grid grid-cols-2 gap-3">
          <FilterSelect label="Show" value={filters.status} onChange={(value) => set({ status: value })} options={statusOptions} anyLabel="All" />
        </div>
        <FilterSummary
          shown={filtered.length}
          total={items.length}
          noun={items.length === 1 ? 'compound' : 'compounds'}
          filtering={filtering}
          onClear={() => setFilters(NO_FILTERS)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/50">
          No compounds match these filters.{' '}
          <button
            type="button"
            onClick={() => setFilters(NO_FILTERS)}
            className="font-semibold text-[#D9B355] underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        </p>
      ) : null}

      <div className="space-y-3">
        {filtered.map((item) => {
          const percent = total === 0 ? 0 : Math.round((item.filled / total) * 100);
          return (
            <Link
              key={item.id}
              href={`/goldenadmin2026/directory/${item.slug}`}
              className={`block rounded-[1rem] border border-white/12 bg-white/5 p-4 transition active:scale-[0.99] hover:border-[rgba(217,179,85,0.45)] ${
                item.active ? '' : 'opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-medium text-white">{item.nameEn}</div>
                  <div className="mt-0.5 text-xs uppercase tracking-[0.16em] text-white/40">
                    {item.placeCount} {item.placeCount === 1 ? 'entry' : 'entries'}
                    {item.active ? null : <span className="ml-2 text-[#D9A441]">Hidden</span>}
                    {/* Found automatically; this shows until OpenStreetMap has it. The
                        app still tries Apple Maps for these, so it is a note, not a fault. */}
                    {item.hasPin ? null : <span className="ml-2 text-white/35">Not on OpenStreetMap</span>}
                  </div>
                </div>
                <div className="flex-none text-right">
                  <div className="text-sm text-[#D9B355]">
                    {item.liveCodes > 0 ? `${item.liveCodes} live ${item.liveCodes === 1 ? 'code' : 'codes'}` : 'No codes'}
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/40">
                    {item.liveCodes > 0 ? `${item.unlocked} unlocked` : 'not set up'}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-white/50">
                  <span>
                    {item.filled} of {total} categories
                  </span>
                  <span>{percent}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#D9B355] transition-all" style={{ width: `${percent}%` }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
