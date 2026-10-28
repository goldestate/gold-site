'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Property } from '@/lib/properties-store';
import { adminFetch } from '@/lib/admin-fetch';
import { formatPrice } from '@/lib/format-price';
import { formatCairoDateTime } from '@/lib/cairo-time';
import {
  locationLabel,
  pricePeriodLabel,
  priceSuffixLabel,
  propertyTypeLabel,
  unitTypeLabel
} from '@/lib/property-taxonomy';
import { useStoredState } from './list-filters';
import { flash } from './flash-banner';

type SortKey = 'name' | 'location' | 'type' | 'unit' | 'beds' | 'baths' | 'area' | 'price' | 'photos' | 'added' | 'status';
type Sort = { key: SortKey; dir: 'asc' | 'desc' };

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: 'name', label: 'Unit' },
  { key: 'location', label: 'Location' },
  { key: 'type', label: 'Type' },
  { key: 'unit', label: 'Unit type' },
  { key: 'beds', label: 'Beds', numeric: true },
  { key: 'baths', label: 'Baths', numeric: true },
  { key: 'area', label: 'Area', numeric: true },
  { key: 'price', label: 'Price', numeric: true },
  { key: 'photos', label: 'Photos', numeric: true },
  { key: 'added', label: 'Added' },
  { key: 'status', label: 'Status' }
];

const time = (iso: string) => new Date(iso).getTime() || 0;

function sortValue(unit: Property, key: SortKey): string | number {
  switch (key) {
    case 'name':
      return unit.name.toLowerCase();
    case 'location':
      return locationLabel(unit.location, 'en');
    case 'type':
      return propertyTypeLabel(unit.propertyType, 'en');
    case 'unit':
      return unitTypeLabel(unit.unitType, 'en');
    case 'beds':
      return unit.bedrooms;
    case 'baths':
      return unit.bathrooms;
    case 'area':
      return unit.area;
    case 'price':
      return unit.price;
    case 'photos':
      return unit.images.length;
    case 'added':
      return time(unit.createdAt);
    case 'status':
      return unit.published ? 1 : 0;
  }
}

/** One CSV cell. Text that starts like a formula is defused so a spreadsheet shows it as text. */
function csvCell(value: string | number): string {
  if (typeof value === 'number') return String(value);
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function downloadCsv(units: Property[]) {
  const header = [
    'Name',
    'Location',
    'Type',
    'Unit type',
    'Bedrooms',
    'Bathrooms',
    'Area (m²)',
    'Price (EGP)',
    'Price period',
    'Photos',
    'Status',
    'Added (Cairo)',
    'Link',
    'ID'
  ];
  const rows = units.map((unit) => [
    unit.name,
    locationLabel(unit.location, 'en'),
    propertyTypeLabel(unit.propertyType, 'en'),
    unitTypeLabel(unit.unitType, 'en'),
    unit.bedrooms,
    unit.bathrooms,
    unit.area,
    unit.price,
    pricePeriodLabel(unit.pricePeriod, 'en'),
    unit.images.length,
    unit.published ? 'Published' : 'Hidden',
    formatCairoDateTime(unit.createdAt),
    `${window.location.origin}/en/properties/${unit.id}`,
    unit.id
  ]);
  // The BOM makes Excel read the file as UTF-8, so "m²" and Arabic names survive.
  const csv = '﻿' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `gold-units-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function UnitsTable({ units, recoverable }: { units: Property[]; recoverable: boolean }) {
  const router = useRouter();
  const [sort, setSort] = useStoredState<Sort>('gold-admin:units-sort', { key: 'added', dir: 'desc' });
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const sorted = useMemo(() => {
    const direction = sort.dir === 'asc' ? 1 : -1;
    return [...units].sort((a, b) => {
      const left = sortValue(a, sort.key);
      const right = sortValue(b, sort.key);
      if (left < right) return -direction;
      if (left > right) return direction;
      // Ties fall back to newest first, so the order never jumps between visits.
      return time(b.createdAt) - time(a.createdAt);
    });
  }, [units, sort]);

  const toggleSort = (key: SortKey, numeric?: boolean) => {
    if (sort.key === key) {
      setSort({ key, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
    } else {
      // Numbers and dates start biggest/newest first; words start at A.
      setSort({ key, dir: numeric || key === 'added' ? 'desc' : 'asc' });
    }
  };

  const setPublished = async (unit: Property, published: boolean) => {
    // One tap used to hide a unit, from a pill that sits under the thumb while
    // scrolling the list on a phone; a hidden unit is gone from the site and the app.
    if (!published && !confirm(`Hide "${unit.name}"? It comes off the website and the app until you publish it again.`)) {
      return;
    }
    setPendingId(unit.id);
    setError('');
    const result = await adminFetch(`/api/properties/${unit.id}`, { method: 'PATCH', body: { published } });
    setPendingId(null);
    if (!result.ok) {
      setError(`Could not update "${unit.name}". ${result.error}`);
      return;
    }
    router.refresh();
  };

  const remove = async (unit: Property) => {
    const question = recoverable
      ? `Delete "${unit.name}"? You can restore it from "Deleted units" at the bottom of this page.`
      : `Delete "${unit.name}"? This cannot be undone.`;
    if (!confirm(question)) return;
    setPendingId(unit.id);
    setError('');
    const result = await adminFetch(`/api/properties/${unit.id}`, { method: 'DELETE' });
    if (!result.ok) {
      setPendingId(null);
      setError(`Could not delete "${unit.name}". ${result.error}`);
      return;
    }
    flash('Property deleted.');
    // The note sits at the top of the page, where the list used to land after a delete.
    window.scrollTo({ top: 0, behavior: 'smooth' });
    router.refresh();
  };

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-5">
        <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-white">
          Units <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold tracking-normal text-white/70">{units.length}</span>
        </h2>
        <button
          type="button"
          onClick={() => downloadCsv(sorted)}
          disabled={units.length === 0}
          className="min-h-[36px] rounded-full border border-white/15 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/75 transition hover:border-[#D9B355] hover:text-[#D9B355] disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      {error ? (
        <div className="mx-4 mt-4 rounded-[1rem] border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300 sm:mx-5">
          {error}
        </div>
      ) : null}

      {units.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-white/55">No units match these filters.</p>
      ) : (
        <div className="relative mt-4 overflow-x-auto border-t border-white/10">
          <table className="w-full min-w-[1180px] text-left text-sm [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
            <thead className="text-[10px] uppercase tracking-[0.14em] text-white/50">
              <tr className="border-b border-white/10">
                {COLUMNS.map((column, index) => {
                  const current = sort.key === column.key;
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={current ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={`px-3 py-3 font-semibold ${column.numeric ? 'text-right' : ''} ${
                        index === 0 ? 'sticky left-0 z-10 bg-[#1e1a1b] pl-4 sm:pl-5' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key, column.numeric)}
                        className={`inline-flex items-center gap-1 uppercase tracking-[0.14em] transition hover:text-white ${
                          current ? 'text-[#D9B355]' : ''
                        }`}
                      >
                        {column.label}
                        <span aria-hidden="true" className={current ? '' : 'opacity-0'}>
                          {sort.dir === 'asc' ? '↑' : '↓'}
                        </span>
                      </button>
                    </th>
                  );
                })}
                <th scope="col" className="px-3 py-3 pr-5 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {sorted.map((unit) => {
                const pending = pendingId === unit.id;
                const suffix = priceSuffixLabel(unit.pricePeriod, 'en');
                return (
                  <tr key={unit.id} className={`group transition hover:bg-white/[0.03] ${pending ? 'opacity-50' : ''}`}>
                    <td className="sticky left-0 z-10 bg-[#1e1a1b] py-2.5 pl-4 pr-3 group-hover:bg-[#252122] sm:pl-5">
                      <Link
                        href={`/goldenadmin2026/properties/${unit.id}/edit`}
                        className="flex w-[240px] items-center gap-3 whitespace-normal"
                      >
                        {unit.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={unit.images[0]} alt="" loading="lazy" className="h-9 w-12 flex-none rounded-[0.5rem] object-cover" />
                        ) : (
                          <span className="h-9 w-12 flex-none rounded-[0.5rem] bg-white/10" />
                        )}
                        <span className="line-clamp-2 font-medium text-white transition group-hover:text-[#D9B355]">{unit.name}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-white/70">{locationLabel(unit.location, 'en')}</td>
                    <td className="px-3 py-2.5 text-white/70">{propertyTypeLabel(unit.propertyType, 'en')}</td>
                    <td className="px-3 py-2.5 text-white/70">{unitTypeLabel(unit.unitType, 'en')}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-white/70">{unit.bedrooms}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-white/70">{unit.bathrooms}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-white/70">{unit.area > 0 ? `${unit.area} m²` : '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-white">
                      {formatPrice(unit.price, 'en')}
                      {suffix ? <span className="text-white/45">{suffix}</span> : null}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-white/70">{unit.images.length}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-white/55">{formatCairoDateTime(unit.createdAt)}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                          unit.published ? 'bg-[rgba(217,179,85,0.15)] text-[#D9B355]' : 'bg-white/10 text-white/55'
                        }`}
                      >
                        {unit.published ? 'Published' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 pr-5">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          href={`/goldenadmin2026/properties/${unit.id}/edit`}
                          className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/75 transition hover:border-white/30"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPublished(unit, !unit.published)}
                          disabled={pending}
                          className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/75 transition hover:border-white/30"
                        >
                          {unit.published ? 'Hide' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(unit)}
                          disabled={pending}
                          className="rounded-full border border-red-400/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:border-red-400/60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
