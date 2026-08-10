'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Property } from '@/lib/properties-store';
import { formatPriceRange } from '@/lib/format-price';

export function PropertiesTable({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const togglePublished = async (property: Property) => {
    setPendingId(property.id);
    try {
      await fetch(`/api/properties/${property.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !property.published })
      });
      router.refresh();
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (property: Property) => {
    if (!confirm(`Delete "${property.name}"? This cannot be undone.`)) return;
    setPendingId(property.id);
    try {
      await fetch(`/api/properties/${property.id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setPendingId(null);
    }
  };

  if (properties.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-10 text-center text-white/60">
        No properties yet. Add your first listing to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-white/10">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-white/50">
          <tr>
            <th className="px-5 py-4">Property</th>
            <th className="px-5 py-4">Location</th>
            <th className="px-5 py-4">Price</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8">
          {properties.map((property) => (
            <tr key={property.id} className={pendingId === property.id ? 'opacity-50' : ''}>
              <td className="flex items-center gap-3 px-5 py-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={property.image}
                  alt=""
                  className="h-12 w-16 flex-none rounded-[0.6rem] object-cover"
                />
                <span className="font-medium text-white">{property.name}</span>
              </td>
              <td className="px-5 py-4 text-white/70">{property.location}</td>
              <td className="px-5 py-4 text-white/70">
                {formatPriceRange(property.priceMin, property.priceMax, 'en')}
              </td>
              <td className="px-5 py-4">
                <button
                  type="button"
                  onClick={() => togglePublished(property)}
                  disabled={pendingId === property.id}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                    property.published
                      ? 'bg-[#D9B355]/15 text-[#D9B355]'
                      : 'bg-white/10 text-white/50'
                  }`}
                >
                  {property.published ? 'Published' : 'Hidden'}
                </button>
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/properties/${property.id}/edit`}
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
  );
}
