'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Property } from '@/lib/properties-store';
import type { PhotoUploadDay, PropertyDeletion } from '@/lib/unit-activity';
import { adminFetch } from '@/lib/admin-fetch';
import { addDays, cairoDayOf, daysFrom, formatCairoDateTime, formatDay } from '@/lib/cairo-time';
import {
  LOCATIONS,
  PROPERTY_TYPES,
  UNIT_TYPES,
  locationLabel,
  propertyTypeLabel,
  unitTypeLabel
} from '@/lib/property-taxonomy';
import { ALL, FilterSearch, FilterSelect, FilterSummary, countOptions, matchesSearch, useStoredState } from './list-filters';
import { UnitsActivityChart, type ActivityBucket } from './units-activity-chart';
import { UnitsTable } from './units-table';
import { CollapsibleSection } from './collapsible-section';

/**
 * The Properties page as data: what is in the catalogue, what was added when,
 * and -- from the photo uploads -- what staff tried to add that never became a
 * unit. One filter row scopes everything under it, so every number agrees.
 */

type RangeChoice = '' | 'today' | '7' | '30' | '90' | 'custom';

type Filters = {
  range: RangeChoice;
  from: string;
  to: string;
  search: string;
  location: string;
  type: string;
  unit: string;
  status: string;
};

const NO_FILTERS: Filters = {
  range: ALL,
  from: '',
  to: '',
  search: '',
  location: ALL,
  type: ALL,
  unit: ALL,
  status: ALL
};

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'custom', label: 'Pick dates' }
];

const PRESET_DAYS: Record<string, number> = { '7': 7, '30': 30, '90': 90 };

// Past three months a column per day is too thin to read, so the chart counts weeks.
const DAILY_LIMIT = 92;

// A unit carries six to nine photos. A few loose ones on a day are usually a
// photo swapped out in the form; this many is a whole unit's worth.
const LOOSE_PHOTOS_FOR_A_UNIT = 5;

type Range = { from: string; to: string };

function resolveRange(filters: Filters, today: string, firstDay: string): Range {
  if (filters.range === 'today') return { from: today, to: today };
  const preset = PRESET_DAYS[filters.range];
  if (preset) return { from: addDays(today, 1 - preset), to: today };
  if (filters.range === 'custom') {
    const from = filters.from || firstDay;
    const to = filters.to || today;
    return from <= to ? { from, to } : { from: to, to: from };
  }
  return { from: firstDay < today ? firstDay : today, to: today };
}

function buildBuckets(
  range: Range,
  units: Property[],
  dayOf: Map<string, string>,
  photoDays: PhotoUploadDay[] | null
): { buckets: ActivityBucket[]; weekly: boolean } {
  const days = daysFrom(range.from, range.to);
  const weekly = days.length > DAILY_LIMIT;

  const added = new Map<string, { published: number; hidden: number }>();
  for (const unit of units) {
    const day = dayOf.get(unit.id) ?? '';
    const entry = added.get(day) ?? { published: 0, hidden: 0 };
    if (unit.published) entry.published += 1;
    else entry.hidden += 1;
    added.set(day, entry);
  }
  const photos = new Map((photoDays ?? []).map((entry) => [entry.day, entry]));

  // Weeks run back from the last day, so the newest column is always a full week.
  const groups: string[][] = [];
  if (weekly) {
    for (let end = days.length; end > 0; end -= 7) groups.unshift(days.slice(Math.max(0, end - 7), end));
  } else {
    for (const day of days) groups.push([day]);
  }

  const buckets = groups.map((group) => {
    const bucket: ActivityBucket = {
      from: group[0],
      to: group[group.length - 1],
      published: 0,
      hidden: 0,
      photos: photoDays ? 0 : null,
      unattached: photoDays ? 0 : null,
      fromDeleted: photoDays ? 0 : null
    };
    for (const day of group) {
      const units = added.get(day);
      if (units) {
        bucket.published += units.published;
        bucket.hidden += units.hidden;
      }
      const uploads = photos.get(day);
      if (uploads && bucket.photos !== null) {
        bucket.photos += uploads.uploaded;
        bucket.unattached = (bucket.unattached ?? 0) + uploads.unattached;
        bucket.fromDeleted = (bucket.fromDeleted ?? 0) + uploads.fromDeleted;
      }
    }
    return bucket;
  });

  return { buckets, weekly };
}

/** Things in a unit's own data that look like a slip. */
function issuesFor(unit: Property): string[] {
  const issues: string[] = [];
  if (unit.propertyType === 'rental' && unit.pricePeriod === 'total') {
    issues.push('Rental priced as "Total price (sale)"');
  }
  if (unit.price <= 0) issues.push('No price');
  const named = UNIT_TYPES.filter((type) => new RegExp(`\\b${type.en}\\b`, 'i').test(unit.name));
  if (named.length > 0 && !named.some((type) => type.value === unit.unitType)) {
    issues.push(`Name says ${named[0].en}, saved as ${unitTypeLabel(unit.unitType, 'en')}`);
  }
  return issues;
}

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

function StatTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">{label}</p>
      <p className="mt-2 text-3xl font-medium text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-white/45">{note}</p>
    </div>
  );
}

function Breakdown({
  title,
  rows,
  active,
  onPick
}: {
  title: string;
  rows: { value: string; label: string; count: number }[];
  active: string;
  onPick: (value: string) => void;
}) {
  const shown = rows.filter((row) => row.count > 0 || row.value === active).sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...shown.map((row) => row.count));
  const total = shown.reduce((sum, row) => sum + row.count, 0);
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-white">{title}</h2>
      {shown.length === 0 ? (
        <p className="mt-3 text-sm text-white/45">Nothing in this range.</p>
      ) : (
        <ul className="mt-3 space-y-1">
          {shown.map((row) => {
            const on = row.value === active;
            return (
              <li key={row.value}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onPick(on ? ALL : row.value)}
                  className={`w-full rounded-[0.75rem] px-2 py-1.5 text-left transition hover:bg-white/[0.05] ${on ? 'bg-white/[0.07]' : ''}`}
                >
                  <span className="flex items-baseline justify-between gap-3 text-sm">
                    <span className={on ? 'text-[#D9B355]' : 'text-white/80'}>{row.label}</span>
                    <span className="tabular-nums text-white/60">
                      {row.count}
                      <span className="ml-1.5 text-xs text-white/35">{Math.round((row.count / Math.max(1, total)) * 100)}%</span>
                    </span>
                  </span>
                  <span className="mt-1 block h-1.5 w-full rounded-full bg-white/[0.06]">
                    <span
                      className="block h-1.5 rounded-full bg-[#D9B355]"
                      style={{ width: `${(row.count / max) * 100}%` }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function UnitsDashboard({
  properties,
  photoDays,
  deletions,
  today
}: {
  properties: Property[];
  /** Null when the photo bucket couldn't be read. */
  photoDays: PhotoUploadDay[] | null;
  /** Null until migration 008 has been run. */
  deletions: PropertyDeletion[] | null;
  /** Today in Cairo, from the server, so the page renders the same on both sides. */
  today: string;
}) {
  const router = useRouter();
  const [filters, setFilters] = useStoredState<Filters>('gold-admin:units-dashboard', NO_FILTERS);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState('');
  const set = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch });

  const dayOf = useMemo(() => new Map(properties.map((unit) => [unit.id, cairoDayOf(unit.createdAt)])), [properties]);
  const firstDay = useMemo(() => {
    let first = today;
    for (const day of dayOf.values()) if (day < first) first = day;
    for (const entry of photoDays ?? []) if (entry.day < first) first = entry.day;
    return first;
  }, [dayOf, photoDays, today]);

  const range = resolveRange(filters, today, firstDay);
  const inDays = (unit: Property, { from, to }: Range) => {
    const day = dayOf.get(unit.id) ?? '';
    return day >= from && day <= to;
  };
  const attributeFiltering = Boolean(filters.search || filters.location || filters.type || filters.unit || filters.status);

  const matchesAttributes = (unit: Property) =>
    (!filters.location || unit.location === filters.location) &&
    (!filters.type || unit.propertyType === filters.type) &&
    (!filters.unit || unit.unitType === filters.unit) &&
    (!filters.status || (filters.status === 'published') === unit.published) &&
    matchesSearch(
      filters.search,
      [unit.name, locationLabel(unit.location, 'en'), propertyTypeLabel(unit.propertyType, 'en'), unitTypeLabel(unit.unitType, 'en')].join(' ')
    );

  const inRange = properties.filter((unit) => inDays(unit, range));
  const shown = inRange.filter(matchesAttributes);

  // Photos have no location or type, so they only appear when nothing narrows by those.
  const photosInView = attributeFiltering ? null : photoDays;
  const { buckets, weekly } = buildBuckets(range, shown, dayOf, photosInView);
  const days = daysFrom(range.from, range.to);
  const daysWithUnits = new Set(shown.map((unit) => dayOf.get(unit.id)));
  const quietDays = days.filter((day) => !daysWithUnits.has(day)).length;

  const preset = PRESET_DAYS[filters.range];
  const previous = preset
    ? properties.filter(
        (unit) => matchesAttributes(unit) && inDays(unit, { from: addDays(range.from, -preset), to: addDays(range.from, -1) })
      ).length
    : null;

  const unitsAddedOn = new Map<string, number>();
  for (const unit of properties) {
    const day = dayOf.get(unit.id) ?? '';
    unitsAddedOn.set(day, (unitsAddedOn.get(day) ?? 0) + 1);
  }
  const looseDays = (photosInView ?? [])
    .filter((entry) => entry.day >= range.from && entry.day <= range.to && entry.unattached >= LOOSE_PHOTOS_FOR_A_UNIT)
    .reverse();

  const flagged = shown
    .map((unit) => ({ unit, issues: issuesFor(unit) }))
    .filter((entry) => entry.issues.length > 0);

  const selectedBucket = filters.range === 'custom' && filters.from && filters.to ? { from: filters.from, to: filters.to } : null;
  const selectBucket = (bucket: ActivityBucket) => {
    const same = selectedBucket && selectedBucket.from === bucket.from && selectedBucket.to === bucket.to;
    set(same ? { range: ALL, from: '', to: '' } : { range: 'custom', from: bucket.from, to: bucket.to });
  };

  const rangeText =
    filters.range === ALL
      ? `since ${formatDay(range.from, { weekday: false })}`
      : range.from === range.to
        ? `on ${formatDay(range.from)}`
        : `${formatDay(range.from, { weekday: false })} – ${formatDay(range.to, { weekday: false })}`;
  const filtering = attributeFiltering || filters.range !== ALL;

  const restore = async (deletion: PropertyDeletion) => {
    setRestoringId(deletion.id);
    setRestoreError('');
    const result = await adminFetch(`/api/properties/deletions/${deletion.id}/restore`, { method: 'POST' });
    setRestoringId(null);
    if (!result.ok) {
      setRestoreError(`Could not restore "${deletion.name}". ${result.error}`);
      return;
    }
    router.push('/goldenadmin2026/properties?restored=1');
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <FilterSelect
            label="Added"
            value={filters.range}
            onChange={(value) => set({ range: value as RangeChoice, from: '', to: '' })}
            options={RANGES}
            anyLabel="All time"
          />
          <FilterSelect
            label="Location"
            value={filters.location}
            onChange={(value) => set({ location: value })}
            options={countOptions(inRange, LOCATIONS.map((item) => ({ value: item.value, label: item.en })), (unit) => unit.location)}
            anyLabel="All locations"
          />
          <FilterSelect
            label="Type"
            value={filters.type}
            onChange={(value) => set({ type: value })}
            options={countOptions(inRange, PROPERTY_TYPES.map((item) => ({ value: item.value, label: item.en })), (unit) => unit.propertyType)}
            anyLabel="All types"
          />
          <FilterSelect
            label="Unit type"
            value={filters.unit}
            onChange={(value) => set({ unit: value })}
            options={countOptions(inRange, UNIT_TYPES.map((item) => ({ value: item.value, label: item.en })), (unit) => unit.unitType)}
            anyLabel="All units"
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(value) => set({ status: value })}
            options={countOptions(
              inRange,
              [
                { value: 'published', label: 'Published' },
                { value: 'hidden', label: 'Hidden' }
              ],
              (unit) => (unit.published ? 'published' : 'hidden')
            )}
            anyLabel="Any status"
          />
        </div>
        {filters.range === 'custom' ? (
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            {(['from', 'to'] as const).map((edge) => (
              <label key={edge} className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  {edge === 'from' ? 'From' : 'To'}
                </span>
                <input
                  type="date"
                  value={filters[edge] || range[edge]}
                  min={firstDay}
                  max={today}
                  onChange={(event) => set(edge === 'from' ? { from: event.target.value } : { to: event.target.value })}
                  className="h-11 w-full rounded-full border border-white/15 bg-white/5 px-4 text-base text-white outline-none transition [color-scheme:dark] focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)] sm:text-sm"
                />
              </label>
            ))}
          </div>
        ) : null}
        <FilterSearch value={filters.search} onChange={(value) => set({ search: value })} placeholder="Search by name or compound" />
        <FilterSummary
          shown={shown.length}
          total={properties.length}
          noun="units"
          filtering={filtering}
          onClear={() => setFilters(NO_FILTERS)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Units added"
          value={String(shown.length)}
          note={
            previous !== null
              ? `${rangeText} · ${shown.length === previous ? 'same as' : shown.length > previous ? `${shown.length - previous} more than` : `${previous - shown.length} fewer than`} the ${preset} days before`
              : rangeText
          }
        />
        <StatTile label="Published" value={String(shown.filter((unit) => unit.published).length)} note="On the website and the app" />
        <StatTile label="Hidden" value={String(shown.filter((unit) => !unit.published).length)} note="Only shown here" />
        <StatTile label="Days with no new unit" value={String(quietDays)} note={`out of ${plural(days.length, 'day')} ${rangeText}`} />
      </div>

      {looseDays.length > 0 ? (
        <section className="rounded-[1.5rem] border border-red-400/30 bg-red-400/[0.07] p-4 sm:p-5" aria-labelledby="loose-photos-title">
          <h2 id="loose-photos-title" className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] text-red-200">
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4 flex-none">
              <path d="M10 3 2.5 16.5h15L10 3Z" strokeLinejoin="round" />
              <path d="M10 8.5v3.5M10 14.5v.01" />
            </svg>
            Photos with no unit
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/65">
            On these days photos were uploaded that no unit uses: a unit that was never saved, or one that was deleted.
          </p>
          <ul className="mt-3 divide-y divide-white/[0.06] text-sm">
            {looseDays.map((entry) => {
              const saved = unitsAddedOn.get(entry.day) ?? 0;
              return (
                <li key={entry.day} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2">
                  <button
                    type="button"
                    onClick={() => set({ range: 'custom', from: entry.day, to: entry.day })}
                    className="font-medium text-white transition hover:text-[#D9B355]"
                  >
                    {formatDay(entry.day)}
                  </button>
                  <span className="tabular-nums text-white/65">
                    {plural(entry.unattached, 'photo')} with no unit · {plural(saved, 'unit')} saved that day
                    {entry.fromDeleted > 0 ? ` · ${entry.fromDeleted} from deleted units` : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <UnitsActivityChart buckets={buckets} weekly={weekly} selected={selectedBucket} onSelect={selectBucket} />
      {photoDays === null ? (
        <p className="-mt-2 text-xs text-white/40">Photo uploads could not be read just now, so the chart shows units only.</p>
      ) : null}

      <div className="grid items-start gap-3 lg:grid-cols-3">
        <Breakdown
          title="By location"
          rows={countOptions(shown, LOCATIONS.map((item) => ({ value: item.value, label: item.en })), (unit) => unit.location).map(
            (row) => ({ ...row, count: row.count ?? 0 })
          )}
          active={filters.location}
          onPick={(value) => set({ location: value })}
        />
        <Breakdown
          title="By type"
          rows={countOptions(shown, PROPERTY_TYPES.map((item) => ({ value: item.value, label: item.en })), (unit) => unit.propertyType).map(
            (row) => ({ ...row, count: row.count ?? 0 })
          )}
          active={filters.type}
          onPick={(value) => set({ type: value })}
        />
        <Breakdown
          title="By unit type"
          rows={countOptions(shown, UNIT_TYPES.map((item) => ({ value: item.value, label: item.en })), (unit) => unit.unitType).map(
            (row) => ({ ...row, count: row.count ?? 0 })
          )}
          active={filters.unit}
          onPick={(value) => set({ unit: value })}
        />
      </div>

      <UnitsTable units={shown} recoverable={deletions !== null} />

      {flagged.length > 0 ? (
        <CollapsibleSection id="units-needs-a-look" title="Needs a look" count={flagged.length}>
          <ul className="mt-3 divide-y divide-white/[0.06] rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 sm:px-5">
            {flagged.map(({ unit, issues }) => (
              <li key={unit.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-white">{unit.name}</p>
                  <p className="mt-0.5 text-xs text-white/55">
                    {issues.join(' · ')} · added {formatCairoDateTime(unit.createdAt)}
                  </p>
                </div>
                <Link
                  href={`/goldenadmin2026/properties/${unit.id}/edit`}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/75 transition hover:border-white/30"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      ) : null}

      {deletions !== null ? (
        <CollapsibleSection id="units-deleted" title="Deleted units" count={deletions.length}>
          {restoreError ? (
            <div className="mt-3 rounded-[1rem] border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{restoreError}</div>
          ) : null}
          {deletions.length === 0 ? (
            <p className="mt-3 text-sm text-white/55">No unit has been deleted since this record started.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/[0.06] rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 sm:px-5">
              {deletions.map((deletion) => (
                <li key={deletion.id} className={`flex flex-wrap items-center gap-3 py-3 ${restoringId === deletion.id ? 'opacity-50' : ''}`}>
                  {deletion.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={deletion.images[0]} alt="" loading="lazy" className="h-9 w-12 flex-none rounded-[0.5rem] object-cover" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{deletion.name}</p>
                    <p className="mt-0.5 text-xs text-white/55">
                      {locationLabel(deletion.location, 'en')} · {propertyTypeLabel(deletion.propertyType, 'en')} ·{' '}
                      {unitTypeLabel(deletion.unitType, 'en')}
                      {deletion.createdAt ? ` · added ${formatCairoDateTime(deletion.createdAt)}` : ''} · deleted{' '}
                      {formatCairoDateTime(deletion.deletedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => restore(deletion)}
                    disabled={restoringId !== null}
                    className="rounded-full border border-[rgba(217,179,85,0.45)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D9B355] transition hover:border-[#D9B355]"
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>
      ) : null}
    </div>
  );
}
