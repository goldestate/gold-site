'use client';

import Link from 'next/link';
import { useState } from 'react';

/** What the Rental Desk needs to know about one submission's agreement. */
export type NdaSummary = {
  id: string;
  status: 'pending' | 'signed';
  token: string;
};

const SITE = 'https://gold-eg.com';

/**
 * A submission's confidentiality agreement at a glance. Signed opens the signed
 * copy; not signed offers the signing link, to send again on WhatsApp to
 * someone who closed the page before signing.
 */
export function NdaBadge({ nda }: { nda: NdaSummary | null | undefined }) {
  const [copied, setCopied] = useState<'yes' | 'failed' | null>(null);

  if (!nda) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">
        No NDA
      </span>
    );
  }

  if (nda.status === 'signed') {
    return (
      <Link
        href={`/goldenadmin2026/nda/${nda.id}`}
        className="inline-flex whitespace-nowrap rounded-full bg-[rgba(90,200,120,0.15)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7ED9A0] transition hover:bg-[rgba(90,200,120,0.25)]"
      >
        NDA signed · View
      </Link>
    );
  }

  const link = `${SITE}/en/nda/${nda.token}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied('yes');
    } catch {
      setCopied('failed');
    }
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Link
        href={`/goldenadmin2026/nda/${nda.id}`}
        className="inline-flex whitespace-nowrap rounded-full bg-[rgba(217,179,85,0.18)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D9B355] transition hover:bg-[rgba(217,179,85,0.28)]"
      >
        NDA not signed
      </Link>
      <button
        type="button"
        onClick={copy}
        className="whitespace-nowrap rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-white/60 transition hover:text-white"
      >
        {copied === 'yes' ? 'Copied' : copied === 'failed' ? 'Copy failed' : 'Copy signing link'}
      </button>
    </span>
  );
}
