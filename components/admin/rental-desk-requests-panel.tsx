'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { MatchWithListing, RentalRequestWithBroker } from '@/lib/rental-desk-store';
import { formatPrice } from '@/lib/format-price';
import { LOCATIONS, locationLabel } from '@/lib/property-taxonomy';
import {
  RENTAL_PROPERTY_TYPES,
  RENTAL_REQUEST_STATUS_LABELS,
  rentalPropertyTypeLabel,
  type RentalRequestStatusValue
} from '@/lib/rental-taxonomy';
import { NdaBadge, type NdaSummary } from './nda-badge';
import { Chevron, ShowMoreButton, useShowMore } from './collapsible-section';
import { adminFetch } from '@/lib/admin-fetch';
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
import { AGREEMENT_OPTIONS, agreementState } from './rental-desk-listings-panel';

const MAX_VISIBLE_MATCHES = 5;
type RequestFilters = { search: string; status: string; location: string; type: string; agreement: string; matches: string };
const NO_REQUEST_FILTERS: RequestFilters = { search: '', status: ALL, location: ALL, type: ALL, agreement: ALL, matches: ALL };

/** Newest first; older requests wait behind "Show more" so the page stays short. */
const FIRST_REQUESTS = 5;

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const requestStatusBadgeClass: Record<RentalRequestStatusValue, string> = {
  new: 'bg-white/10 text-white/60',
  matching: 'bg-[rgba(217,179,85,0.18)] text-[#D9B355]',
  matches_sent: 'bg-[rgba(90,200,120,0.15)] text-[#7ED9A0]',
  closed: 'bg-white/10 text-white/40',
  expired: 'bg-red-400/10 text-red-300'
};

function scoreBadgeClass(score: number): string {
  if (score >= 80) return 'bg-[rgba(90,200,120,0.15)] text-[#7ED9A0]';
  if (score >= 65) return 'bg-[rgba(217,179,85,0.18)] text-[#D9B355]';
  return 'bg-white/10 text-white/60';
}

function MatchRow({ match, onSent }: { match: MatchWithListing; onSent: (matchId: string) => Promise<void> }) {
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSent(match.id);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-white/10 bg-black/20 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${scoreBadgeClass(match.matchScore)}`}>
          {match.matchScore}%
        </span>
        <div>
          <div className="text-sm text-white">
            {rentalPropertyTypeLabel(match.listing.propertyType, 'en')} · {locationLabel(match.listing.location, 'en')} ·{' '}
            {formatPrice(match.listing.price, 'en')}
          </div>
          <div className="text-xs text-white/50">
            Owner: {match.listing.owner.name} ({match.listing.owner.phone})
          </div>
        </div>
      </div>
      {match.sentToBroker ? (
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
          Sent {match.sentAt ? formatDate(match.sentAt) : ''}
        </span>
      ) : (
        <button
          type="button"
          onClick={handleSend}
          disabled={isSending}
          className="btn-gold rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSending ? 'Sending...' : 'Mark as sent'}
        </button>
      )}
    </div>
  );
}

/**
 * One request, folded down to who and what: its matches open on demand, and an
 * unwanted request can be deleted after a second, explicit tap.
 */
function RequestCard({
  request,
  matches,
  nda,
  onSent
}: {
  request: RentalRequestWithBroker;
  matches: MatchWithListing[];
  nda: NdaSummary | undefined;
  onSent: (matchId: string) => Promise<void>;
}) {
  const router = useRouter();
  const [showMatches, setShowMatches] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const visibleMatches = matches.slice(0, MAX_VISIBLE_MATCHES);
  const hiddenCount = matches.length - visibleMatches.length;
  const toSend = matches.filter((match) => !match.sentToBroker).length;

  const remove = async () => {
    setDeleting(true);
    setDeleteError('');
    const result = await adminFetch(`/api/rental-desk/requests/${request.id}`, { method: 'DELETE' });
    if (result.ok) {
      router.refresh();
      return;
    }
    setDeleting(false);
    setDeleteError(result.error);
  };

  return (
    <div className={`rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:p-6 ${deleting ? 'opacity-50' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-serif text-xs uppercase tracking-[0.3em] text-[rgba(217,179,85,0.9)]">
            {request.referenceCode}
          </div>
          <div className="mt-1 text-white">
            {request.broker.name}
            {request.broker.company ? ` · ${request.broker.company}` : ''}
          </div>
          <a href={`tel:${request.broker.phone}`} className="text-xs text-white/50 hover:text-[#D9B355]">
            {request.broker.phone}
          </a>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
              requestStatusBadgeClass[request.status as RentalRequestStatusValue] ?? 'bg-white/10 text-white/60'
            }`}
          >
            {RENTAL_REQUEST_STATUS_LABELS[request.status as RentalRequestStatusValue] ?? request.status}
          </span>
          <NdaBadge nda={nda} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/70">
        <span>{rentalPropertyTypeLabel(request.propertyType, 'en')}</span>
        <span>{locationLabel(request.location, 'en')}</span>
        {request.budgetMin || request.budgetMax ? (
          <span>
            Budget: {request.budgetMin ? formatPrice(request.budgetMin, 'en') : 'Any'} –{' '}
            {request.budgetMax ? formatPrice(request.budgetMax, 'en') : 'Any'}
          </span>
        ) : null}
        {request.bedrooms ? <span>{request.bedrooms}+ beds</span> : null}
        {request.furnished !== null ? <span>{request.furnished ? 'Furnished' : 'Unfurnished'}</span> : null}
        {request.moveInDate ? <span>Move-in: {formatDate(request.moveInDate)}</span> : null}
      </div>
      {request.notes ? <p className="mt-2 text-sm text-white/50">{request.notes}</p> : null}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
        {matches.length === 0 ? (
          <p className="text-xs uppercase tracking-[0.14em] text-white/40">No matches yet</p>
        ) : (
          <button
            type="button"
            onClick={() => setShowMatches((open) => !open)}
            aria-expanded={showMatches}
            className="inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:text-white"
          >
            Matches ({matches.length})
            {toSend > 0 ? <span className="text-[#D9B355]">· {toSend} to send</span> : null}
            <Chevron open={showMatches} className="h-4 w-4" />
          </button>
        )}
        {confirming ? null : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Delete ${request.referenceCode}`}
            title="Delete"
            className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full text-red-300/70 transition hover:bg-red-400/10 hover:text-red-300"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5.5 5.5l.7 10.1a1.5 1.5 0 0 0 1.5 1.4h4.6a1.5 1.5 0 0 0 1.5-1.4l.7-10.1M8.5 9v4.5M11.5 9v4.5" />
            </svg>
          </button>
        )}
      </div>

      {confirming ? (
        <div className="mt-3 rounded-[1rem] border border-red-400/30 bg-red-400/10 p-4">
          <p className="text-sm text-white/85">
            Delete {request.referenceCode} for good? Its matches
            {nda ? (nda.status === 'signed' ? ' and its signed agreement' : ' and its agreement') : ''} go too. This
            can&rsquo;t be undone.
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

      {showMatches && matches.length > 0 ? (
        <div className="mt-3 space-y-2">
          {visibleMatches.map((match) => (
            <MatchRow key={match.id} match={match} onSent={onSent} />
          ))}
          {hiddenCount > 0 ? (
            <p className="text-xs text-white/40">+{hiddenCount} more match{hiddenCount === 1 ? '' : 'es'}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function RentalDeskRequestsPanel({
  requests,
  matchesByRequest,
  ndas
}: {
  requests: RentalRequestWithBroker[];
  matchesByRequest: Record<string, MatchWithListing[]>;
  /** Agreements by request id. */
  ndas: Record<string, NdaSummary>;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [filters, setFilters] = useStoredState<RequestFilters>('gold-admin:request-filters', NO_REQUEST_FILTERS);
  const set = (patch: Partial<RequestFilters>) => setFilters({ ...filters, ...patch });

  const matchState = (request: RentalRequestWithBroker): string => {
    const matches = matchesByRequest[request.id] ?? [];
    if (matches.length === 0) return 'none';
    return matches.some((match) => !match.sentToBroker) ? 'to-send' : 'all-sent';
  };

  const filtered = requests.filter(
    (request) =>
      (!filters.status || request.status === filters.status) &&
      (!filters.location || request.location === filters.location) &&
      (!filters.type || request.propertyType === filters.type) &&
      (!filters.agreement || agreementState(ndas[request.id]) === filters.agreement) &&
      (!filters.matches || matchState(request) === filters.matches) &&
      matchesSearch(
        filters.search,
        [
          request.referenceCode,
          request.broker.name,
          request.broker.company ?? '',
          request.broker.phone,
          request.notes ?? '',
          locationLabel(request.location, 'en'),
          rentalPropertyTypeLabel(request.propertyType, 'en')
        ].join(' ')
      )
  );
  const filtering = Boolean(filters.search || filters.status || filters.location || filters.type || filters.agreement || filters.matches);
  const shown = useShowMore(filtered, FIRST_REQUESTS);

  const handleMarkSent = async (matchId: string) => {
    setError('');
    try {
      const response = await fetch(`/api/rental-desk/matches/${matchId}`, { method: 'PATCH' });
      if (!response.ok) {
        setError('Could not mark this match as sent. Please try again.');
        return;
      }
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    }
  };

  if (requests.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-10 text-center text-white/60">
        No rental requests yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
        <FilterSearch value={filters.search} onChange={(value) => set({ search: value })} placeholder="Search by reference or broker" />
        <FilterChips
          label="Request status"
          options={countOptions(
            requests,
            (Object.keys(RENTAL_REQUEST_STATUS_LABELS) as RentalRequestStatusValue[]).map((value) => ({
              value,
              label: RENTAL_REQUEST_STATUS_LABELS[value]
            })),
            (request) => request.status
          )}
          value={filters.status}
          onChange={(value) => set({ status: value })}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <FilterSelect
            label="Location"
            value={filters.location}
            onChange={(value) => set({ location: value })}
            options={countOptions(requests, LOCATIONS.map((item) => ({ value: item.value, label: item.en })), (request) => request.location)}
            anyLabel="All locations"
          />
          <FilterSelect
            label="Type"
            value={filters.type}
            onChange={(value) => set({ type: value })}
            options={countOptions(requests, RENTAL_PROPERTY_TYPES.map((item) => ({ value: item.value, label: item.en })), (request) => request.propertyType)}
            anyLabel="All types"
          />
          <FilterSelect
            label="Agreement"
            value={filters.agreement}
            onChange={(value) => set({ agreement: value })}
            options={countOptions(requests, AGREEMENT_OPTIONS, (request) => agreementState(ndas[request.id]))}
            anyLabel="Any"
          />
          <FilterSelect
            label="Matches"
            value={filters.matches}
            onChange={(value) => set({ matches: value })}
            options={countOptions(
              requests,
              [
                { value: 'to-send', label: 'Matches to send' },
                { value: 'all-sent', label: 'All sent' },
                { value: 'none', label: 'No matches yet' }
              ],
              matchState
            )}
            anyLabel="Any"
          />
        </div>
        <FilterSummary
          shown={filtered.length}
          total={requests.length}
          noun="requests"
          filtering={filtering}
          onClear={() => setFilters(NO_REQUEST_FILTERS)}
        />
      </div>

      {error ? (
        <div className="rounded-[1rem] border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-8 text-center text-sm text-white/60">
          No requests match these filters.{' '}
          <button
            type="button"
            onClick={() => setFilters(NO_REQUEST_FILTERS)}
            className="font-semibold text-[#D9B355] underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : null}

      {shown.visible.map((request) => (
        <RequestCard
          key={request.id}
          request={request}
          matches={matchesByRequest[request.id] ?? []}
          nda={ndas[request.id]}
          onSent={handleMarkSent}
        />
      ))}

      {shown.canToggle ? (
        <ShowMoreButton hidden={shown.hidden} all={shown.all} onClick={shown.toggle} noun="requests" />
      ) : null}
    </div>
  );
}
