'use client';

/**
 * Approve / Reject, shown on a listing or request that is waiting for review.
 * Rejecting keeps the record (it is set inactive or closed), so no second tap.
 */
export function ReviewButtons({
  label,
  busy,
  onApprove,
  onReject
}: {
  /** Names the item for screen readers, e.g. "the listing from Sara". */
  label: string;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-[rgba(217,179,85,0.08)] p-3">
      <p className="mr-auto text-xs font-semibold uppercase tracking-[0.14em] text-[#D9B355]">Waiting for your approval</p>
      <button
        type="button"
        onClick={onReject}
        disabled={busy}
        aria-label={`Reject ${label}`}
        className="min-h-[44px] rounded-full border border-white/15 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:border-red-300/60 hover:text-red-300 disabled:opacity-50"
      >
        Reject
      </button>
      <button
        type="button"
        onClick={onApprove}
        disabled={busy}
        aria-label={`Approve ${label}`}
        className="min-h-[44px] rounded-full bg-[#D9B355] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#231F20] transition hover:bg-[#e5c46e] disabled:opacity-50"
      >
        Approve
      </button>
    </div>
  );
}
