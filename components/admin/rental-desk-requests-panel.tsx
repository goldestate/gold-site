'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { MatchWithListing, RentalRequestWithBroker } from '@/lib/rental-desk-store';
import { formatPrice } from '@/lib/format-price';
import { locationLabel } from '@/lib/property-taxonomy';
import { RENTAL_REQUEST_STATUS_LABELS, rentalPropertyTypeLabel, type RentalRequestStatusValue } from '@/lib/rental-taxonomy';

const MAX_VISIBLE_MATCHES = 5;

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

export function RentalDeskRequestsPanel({
  requests,
  matchesByRequest
}: {
  requests: RentalRequestWithBroker[];
  matchesByRequest: Record<string, MatchWithListing[]>;
}) {
  const router = useRouter();
  const [error, setError] = useState('');

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
      {error ? (
        <div className="rounded-[1rem] border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {requests.map((request) => {
        const matches = matchesByRequest[request.id] ?? [];
        const visibleMatches = matches.slice(0, MAX_VISIBLE_MATCHES);
        const hiddenCount = matches.length - visibleMatches.length;

        return (
          <div key={request.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
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
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
                  requestStatusBadgeClass[request.status as RentalRequestStatusValue] ?? 'bg-white/10 text-white/60'
                }`}
              >
                {RENTAL_REQUEST_STATUS_LABELS[request.status as RentalRequestStatusValue] ?? request.status}
              </span>
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

            <div className="mt-5 space-y-2">
              {visibleMatches.length === 0 ? (
                <p className="text-xs uppercase tracking-[0.14em] text-white/40">No matches yet</p>
              ) : (
                <>
                  <div className="text-xs uppercase tracking-[0.14em] text-white/40">
                    Top matches ({matches.length})
                  </div>
                  {visibleMatches.map((match) => (
                    <MatchRow key={match.id} match={match} onSent={handleMarkSent} />
                  ))}
                  {hiddenCount > 0 ? (
                    <p className="text-xs text-white/40">+{hiddenCount} more match{hiddenCount === 1 ? '' : 'es'}</p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
