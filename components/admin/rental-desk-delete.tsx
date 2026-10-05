'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminFetch } from '@/lib/admin-fetch';

/**
 * Delete, then "Delete for good?" in place: one extra tap, because a deleted
 * request or listing, its matches and its signed agreement don't come back.
 */
export function RentalDeskDeleteButton({
  url,
  label,
  onDeleted
}: {
  /** The DELETE endpoint for this one row. */
  url: string;
  /** What is being deleted, for screen readers: "the listing from Ahmed". */
  label: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const remove = async () => {
    setBusy(true);
    setError('');
    const result = await adminFetch(url, { method: 'DELETE' });
    setBusy(false);
    // Not found: someone else already deleted it. The refresh shows that.
    if (result.ok || result.status === 404) {
      setDone(true);
      onDeleted?.();
      router.refresh();
      return;
    }
    setError(result.error);
  };

  // Until the refresh takes the row away.
  if (done) return <span className="text-xs uppercase tracking-[0.14em] text-white/40">Deleted</span>;

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${label}`}
        className="min-h-[36px] rounded-full border border-red-400/40 px-4 text-[11px] uppercase tracking-[0.14em] text-red-300 transition hover:border-red-400/70"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-white/60">Delete for good?</span>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="min-h-[36px] rounded-full border border-red-400/60 bg-red-500/10 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-200 disabled:opacity-40"
      >
        {busy ? 'Deleting...' : 'Yes, delete'}
      </button>
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          setError('');
        }}
        disabled={busy}
        className="min-h-[36px] rounded-full border border-white/15 px-4 text-[11px] uppercase tracking-[0.14em] text-white/60"
      >
        Cancel
      </button>
      {error ? <p className="w-full text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
