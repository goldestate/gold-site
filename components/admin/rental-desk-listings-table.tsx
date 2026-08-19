'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { RentalListingWithOwner } from '@/lib/rental-desk-store';
import { formatPrice } from '@/lib/format-price';
import { locationLabel } from '@/lib/property-taxonomy';
import { RENTAL_LISTING_STATUSES, rentalPropertyTypeLabel, type RentalListingStatusValue } from '@/lib/rental-taxonomy';

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const statusBadgeClass: Record<RentalListingStatusValue, string> = {
  pending_review: 'bg-[rgba(217,179,85,0.18)] text-[#D9B355]',
  active: 'bg-[rgba(90,200,120,0.15)] text-[#7ED9A0]',
  rented: 'bg-white/10 text-white/60',
  inactive: 'bg-red-400/10 text-red-300'
};

export function RentalDeskListingsTable({ listings }: { listings: RentalListingWithOwner[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const changeStatus = async (listing: RentalListingWithOwner, status: RentalListingStatusValue) => {
    if (status === listing.status) return;
    setPendingId(listing.id);
    setError('');
    try {
      const response = await fetch(`/api/rental-desk/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        setError(`Could not update the listing from ${listing.owner.name}. Please try again.`);
        return;
      }
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setPendingId(null);
    }
  };

  if (listings.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-10 text-center text-white/60">
        No rental listings yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-[1rem] border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[1.5rem] border border-white/10">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-white/50">
            <tr>
              <th className="px-5 py-4">Owner</th>
              <th className="px-5 py-4">Property</th>
              <th className="px-5 py-4">Price</th>
              <th className="px-5 py-4">Beds / Furnished</th>
              <th className="px-5 py-4">Added</th>
              <th className="px-5 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {listings.map((listing) => (
              <tr key={listing.id} className={pendingId === listing.id ? 'opacity-50' : ''}>
                <td className="px-5 py-4">
                  <div className="font-medium text-white">{listing.owner.name}</div>
                  <a href={`tel:${listing.owner.phone}`} className="text-xs text-white/50 hover:text-[#D9B355]">
                    {listing.owner.phone}
                  </a>
                </td>
                <td className="px-5 py-4 text-white/70">
                  {rentalPropertyTypeLabel(listing.propertyType, 'en')} · {locationLabel(listing.location, 'en')}
                </td>
                <td className="px-5 py-4 text-white/70">{formatPrice(listing.price, 'en')}</td>
                <td className="px-5 py-4 text-white/70">
                  {listing.bedrooms ?? '—'} bed{listing.furnished === null ? '' : listing.furnished ? ' · Furnished' : ' · Unfurnished'}
                </td>
                <td className="px-5 py-4 text-white/50">{formatDate(listing.createdAt)}</td>
                <td className="px-5 py-4">
                  <select
                    value={listing.status}
                    disabled={pendingId === listing.id}
                    onChange={(event) => changeStatus(listing, event.target.value as RentalListingStatusValue)}
                    className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] outline-none ${
                      statusBadgeClass[listing.status as RentalListingStatusValue] ?? 'bg-white/10 text-white/60'
                    }`}
                  >
                    {RENTAL_LISTING_STATUSES.map((option) => (
                      <option key={option.value} value={option.value} className="bg-[#231F20] text-white">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
