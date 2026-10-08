'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { RentalListingWithOwner } from '@/lib/rental-desk-store';
import { formatPrice } from '@/lib/format-price';
import { locationLabel } from '@/lib/property-taxonomy';
import { RENTAL_LISTING_STATUSES, rentalPropertyTypeLabel, type RentalListingStatusValue } from '@/lib/rental-taxonomy';
import { adminFetch } from '@/lib/admin-fetch';
import { NdaBadge, type NdaSummary } from './nda-badge';
import { Chevron, ShowMoreButton, useShowMore } from './collapsible-section';

/** Newest first; older listings wait behind "Show more" so the page stays short. */
const FIRST_LISTINGS = 5;

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

function BinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5.5 5.5l.7 10.1a1.5 1.5 0 0 0 1.5 1.4h4.6a1.5 1.5 0 0 0 1.5-1.4l.7-10.1M8.5 9v4.5M11.5 9v4.5" />
    </svg>
  );
}

/**
 * One listing, folded down to who, what and its status: its photos and dates
 * open on demand. An owner's listing can be deleted after a second, explicit
 * tap; an in-house one is a copy of a property, so it's changed in Properties.
 */
function ListingCard({ listing, nda }: { listing: RentalListingWithOwner; nda: NdaSummary | undefined }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const inHouse = Boolean(listing.sourcePropertyId);
  const editHref = listing.sourcePropertyId ? `/goldenadmin2026/properties/${listing.sourcePropertyId}/edit` : null;

  const changeStatus = async (status: RentalListingStatusValue) => {
    if (status === listing.status) return;
    setSaving(true);
    setStatusError('');
    const result = await adminFetch(`/api/rental-desk/listings/${listing.id}`, { method: 'PATCH', body: { status } });
    setSaving(false);
    if (result.ok) router.refresh();
    else setStatusError(result.error);
  };

  const remove = async () => {
    setDeleting(true);
    setDeleteError('');
    const result = await adminFetch(`/api/rental-desk/listings/${listing.id}`, { method: 'DELETE' });
    if (result.ok) {
      router.refresh();
      return;
    }
    setDeleting(false);
    setDeleteError(result.error);
  };

  const facts = [
    rentalPropertyTypeLabel(listing.propertyType, 'en'),
    locationLabel(listing.location, 'en'),
    formatPrice(listing.price, 'en'),
    listing.bedrooms ? `${listing.bedrooms} bed` : null,
    listing.furnished === null ? null : listing.furnished ? 'Furnished' : 'Unfurnished',
    `Added ${formatDate(listing.createdAt)}`
  ].filter((item): item is string => Boolean(item));

  return (
    <div className={`rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:p-6 ${deleting || saving ? 'opacity-50' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-white">{listing.owner.name}</span>
            {editHref ? (
              <Link
                href={editHref}
                className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/60 transition hover:bg-white/15 hover:text-white"
              >
                In-house
              </Link>
            ) : null}
          </div>
          <a href={`tel:${listing.owner.phone}`} className="text-xs text-white/50 hover:text-[#D9B355]">
            {listing.owner.phone}
          </a>
        </div>
        <div className="flex flex-col items-end gap-2">
          <select
            value={listing.status}
            disabled={saving || deleting}
            aria-label={`Status of the listing from ${listing.owner.name}`}
            onChange={(event) => changeStatus(event.target.value as RentalListingStatusValue)}
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
          <NdaBadge nda={nda} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/70">
        {facts.map((fact) => (
          <span key={fact}>{fact}</span>
        ))}
      </div>
      {statusError ? <p className="mt-2 text-sm text-red-300">{statusError}</p> : null}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:text-white"
        >
          Details
          {listing.photos.length > 0 ? (
            <span className="text-white/45">
              · {listing.photos.length} photo{listing.photos.length === 1 ? '' : 's'}
            </span>
          ) : null}
          <Chevron open={open} className="h-4 w-4" />
        </button>
        {inHouse && editHref ? (
          <Link
            href={editHref}
            className="inline-flex min-h-[44px] items-center px-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/45 transition hover:text-[#D9B355]"
          >
            Edit in Properties
          </Link>
        ) : confirming ? null : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Delete the listing from ${listing.owner.name}`}
            title="Delete"
            className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full text-red-300/70 transition hover:bg-red-400/10 hover:text-red-300"
          >
            <BinIcon />
          </button>
        )}
      </div>

      {confirming ? (
        <div className="mt-3 rounded-[1rem] border border-red-400/30 bg-red-400/10 p-4">
          <p className="text-sm text-white/85">
            Delete the listing from {listing.owner.name} for good? Its matches
            {nda ? (nda.status === 'signed' ? ', its signed agreement' : ', its agreement') : ''}
            {listing.photos.length > 0 ? ' and its photos' : ''} go too. This can&rsquo;t be undone.
          </p>
          {deleteError ? <p className="mt-2 text-sm text-red-300">{deleteError}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              className="min-h-[44px] rounded-full bg-red-500/80 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-red-500 disabled:opacity-60"
            >
              {deleting ? 'Deleting...' : 'Delete for good'}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setDeleteError('');
              }}
              disabled={deleting}
              className="min-h-[44px] rounded-full border border-white/15 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:text-white"
            >
              Keep it
            </button>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="mt-3 space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-white/40">Added</dt>
              <dd className="mt-1 text-white/80">{formatDate(listing.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-white/40">Available from</dt>
              <dd className="mt-1 text-white/80">{listing.availableFrom ? formatDate(listing.availableFrom) : 'Now'}</dd>
            </div>
          </dl>
          {listing.photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {listing.photos.map((url, index) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-[0.75rem] bg-black/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Photo ${index + 1} of the listing from ${listing.owner.name}`} loading="lazy" className="aspect-square w-full object-cover" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs uppercase tracking-[0.14em] text-white/40">No photos</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function RentalDeskListingsPanel({
  listings,
  ndas
}: {
  listings: RentalListingWithOwner[];
  /** Agreements by listing id. */
  ndas: Record<string, NdaSummary>;
}) {
  const shown = useShowMore(listings, FIRST_LISTINGS);

  if (listings.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-10 text-center text-white/60">
        No rental listings yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shown.visible.map((listing) => (
        <ListingCard key={listing.id} listing={listing} nda={ndas[listing.id]} />
      ))}
      {shown.canToggle ? (
        <ShowMoreButton hidden={shown.hidden} all={shown.all} onClick={shown.toggle} noun="listings" />
      ) : null}
    </div>
  );
}
