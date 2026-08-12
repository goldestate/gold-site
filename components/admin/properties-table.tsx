'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Property } from '@/lib/properties-store';
import { formatPrice } from '@/lib/format-price';
import { locationLabel, propertyTypeLabel, unitTypeLabel } from '@/lib/property-taxonomy';

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function PropertiesTable({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return properties;
    return properties.filter((property) => {
      const haystack = [
        property.name,
        locationLabel(property.location, 'en'),
        propertyTypeLabel(property.propertyType, 'en'),
        unitTypeLabel(property.unitType, 'en')
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [properties, search]);

  const togglePublished = async (property: Property) => {
    setPendingId(property.id);
    setError('');
    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !property.published })
      });
      if (!response.ok) {
        setError(`Could not update "${property.name}". Please try again.`);
        return;
      }
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (property: Property) => {
    if (!confirm(`Delete "${property.name}"? This cannot be undone.`)) return;
    setPendingId(property.id);
    setError('');
    try {
      const response = await fetch(`/api/properties/${property.id}`, { method: 'DELETE' });
      if (!response.ok) {
        setError(`Could not delete "${property.name}". Please try again.`);
        setPendingId(null);
        return;
      }
      router.push('/goldenadmin2026/properties?deleted=1');
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block max-w-xs">
        <span className="sr-only">Search properties</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or location..."
          className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)]"
        />
      </label>

      {error ? (
        <div className="rounded-[1rem] border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {properties.length === 0 ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-10 text-center text-white/60">
          No properties yet. Add your first listing to get started.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-10 text-center text-white/60">
          No properties match &ldquo;{search}&rdquo;.
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards so Edit/Delete are always visible without side-scrolling */}
          <div className="space-y-3 md:hidden">
            {filtered.map((property) => (
              <div
                key={property.id}
                className={`rounded-[1.25rem] border border-white/10 bg-white/5 p-4 transition ${
                  pendingId === property.id ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={property.images[0]}
                    alt=""
                    className="h-14 w-16 flex-none rounded-[0.6rem] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{property.name}</p>
                    <p className="mt-0.5 text-xs text-white/60">
                      {propertyTypeLabel(property.propertyType, 'en')} · {unitTypeLabel(property.unitType, 'en')}
                    </p>
                    <p className="mt-0.5 text-xs text-white/60">{locationLabel(property.location, 'en')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePublished(property)}
                    disabled={pendingId === property.id}
                    className={`flex-none rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                      property.published
                        ? 'bg-[rgba(217,179,85,0.15)] text-[#D9B355]'
                        : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {property.published ? 'Published' : 'Hidden'}
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-white/50">
                  <span>{formatPrice(property.price, 'en')}</span>
                  <span>{formatDate(property.createdAt)}</span>
                </div>

                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/goldenadmin2026/properties/${property.id}/edit`}
                    className="flex-1 rounded-full border border-white/15 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-white/75 transition hover:border-white/30"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(property)}
                    disabled={pendingId === property.id}
                    className="flex-1 rounded-full border border-red-400/30 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-300 transition hover:border-red-400/60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop / tablet: full table */}
          <div className="hidden overflow-x-auto rounded-[1.5rem] border border-white/10 md:block">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-white/50">
                <tr>
                  <th className="px-5 py-4">Property</th>
                  <th className="px-5 py-4">Type / Unit</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4">Added</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filtered.map((property) => (
                  <tr key={property.id} className={pendingId === property.id ? 'opacity-50' : ''}>
                    <td className="flex items-center gap-3 px-5 py-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={property.images[0]}
                        alt=""
                        className="h-12 w-16 flex-none rounded-[0.6rem] object-cover"
                      />
                      <span className="font-medium text-white">{property.name}</span>
                    </td>
                    <td className="px-5 py-4 text-white/70">
                      {propertyTypeLabel(property.propertyType, 'en')} · {unitTypeLabel(property.unitType, 'en')}
                    </td>
                    <td className="px-5 py-4 text-white/70">{locationLabel(property.location, 'en')}</td>
                    <td className="px-5 py-4 text-white/70">{formatPrice(property.price, 'en')}</td>
                    <td className="px-5 py-4 text-white/50">{formatDate(property.createdAt)}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => togglePublished(property)}
                        disabled={pendingId === property.id}
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                          property.published
                            ? 'bg-[rgba(217,179,85,0.15)] text-[#D9B355]'
                            : 'bg-white/10 text-white/50'
                        }`}
                      >
                        {property.published ? 'Published' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/goldenadmin2026/properties/${property.id}/edit`}
                          className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/75 transition hover:border-white/30"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(property)}
                          disabled={pendingId === property.id}
                          className="rounded-full border border-red-400/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-red-300 transition hover:border-red-400/60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
