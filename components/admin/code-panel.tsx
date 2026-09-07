'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { CompoundCode } from '@/lib/directory-store';
import { inviteMessage, whatsappComposeUrl } from '@/lib/app-links';

const fieldClass =
  'w-full rounded-[0.8rem] border border-white/12 bg-white/5 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/30 focus:border-[#D9B355]';

type Status = { text: string; tone: 'live' | 'ending' | 'over' };

/**
 * A code per stay, each with its own end date.
 *
 * Two guests at the same compound leaving on different days need two codes at
 * once, which is why creating one no longer ends the others. A code with an end
 * date needs no action when the stay finishes: it stops being redeemable, and
 * the devices that used it lose the list on their next launch.
 */
function statusOf(code: CompoundCode, now: number): Status {
  if (!code.active) return { text: 'Revoked', tone: 'over' };
  if (!code.expiresAt) return { text: 'No end date', tone: 'live' };

  const ends = new Date(code.expiresAt);
  const label = ends.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  if (ends.getTime() <= now) return { text: `Ended ${label}`, tone: 'over' };

  const days = Math.ceil((ends.getTime() - now) / 86_400_000);
  return { text: days <= 2 ? `Ends ${label} (${days}d)` : `Ends ${label}`, tone: days <= 2 ? 'ending' : 'live' };
}

const toneClass: Record<Status['tone'], string> = {
  live: 'text-[#8FAE78]',
  ending: 'text-[#D9A441]',
  over: 'text-white/35'
};

export function CodePanel({
  compoundId,
  compoundName,
  codes
}: {
  compoundId: string;
  compoundName: string;
  codes: CompoundCode[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Fixed at render rather than ticking: a countdown that moves while staff read
  // it buys nothing, and the server is what actually decides.
  const now = Date.now();
  const live = codes.filter((code) => statusOf(code, now).tone !== 'over');
  const finished = codes.filter((code) => statusOf(code, now).tone === 'over');

  const post = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/directory/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.ok;
  };

  const create = async () => {
    setBusy('create');
    setError('');
    const ok = await post({ action: 'create', compoundId, label, expiresOn });
    setBusy(null);
    if (!ok) {
      setError('Could not create that code.');
      return;
    }
    setLabel('');
    setExpiresOn('');
    router.refresh();
  };

  const revoke = async (code: CompoundCode) => {
    const who = code.label || 'this code';
    if (
      !window.confirm(
        `Revoke ${code.code}?\n\n${who} loses the vetted list the next time their phone is online. No other guest is affected.`
      )
    ) {
      return;
    }
    setBusy(code.id);
    setError('');
    const ok = await post({ action: 'revoke', codeId: code.id });
    setBusy(null);
    if (!ok) setError('Could not revoke that code.');
    router.refresh();
  };

  const revokeAll = async () => {
    if (
      !window.confirm(
        'Cut off everyone?\n\nEvery code for this compound stops working and every guest loses the vetted list, including anyone mid-stay. To end one guest early, revoke just their code instead.'
      )
    ) {
      return;
    }
    setBusy('all');
    setError('');
    const ok = await post({ action: 'revokeAll', compoundId });
    setBusy(null);
    if (!ok) setError('Could not cut off access.');
    router.refresh();
  };

  const copyInvite = async (code: CompoundCode) => {
    try {
      await navigator.clipboard.writeText(inviteMessage(code.code, compoundName));
      setCopied(code.id);
    } catch {
      // Clipboard needs a secure context and can be refused outright.
      setCopied(`failed:${code.id}`);
    }
    setTimeout(() => setCopied(null), 2500);
  };

  const row = (code: CompoundCode) => {
    const status = statusOf(code, now);
    const over = status.tone === 'over';
    return (
      <div key={code.id} className="rounded-[0.9rem] border border-white/12 bg-black/25 p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className={`font-mono text-lg tracking-[0.1em] ${over ? 'text-white/35 line-through' : 'text-[#D9B355]'}`}>
            {code.code}
          </span>
          <span className={`text-[11px] uppercase tracking-[0.16em] ${toneClass[status.tone]}`}>
            {status.text}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 text-xs text-white/45">
          <span>{code.label || 'No name'}</span>
          <span>
            {code.redemptionCount} {code.redemptionCount === 1 ? 'phone' : 'phones'}
          </span>
        </div>

        {over ? null : (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copyInvite(code)}
              className="rounded-full border border-white/20 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white"
            >
              {copied === code.id ? 'Copied' : copied === `failed:${code.id}` ? 'Copy failed' : 'Copy invite'}
            </button>
            <a
              href={whatsappComposeUrl(inviteMessage(code.code, compoundName))}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/20 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white"
            >
              Send on WhatsApp
            </a>
            <button
              type="button"
              onClick={() => revoke(code)}
              disabled={busy !== null}
              className="rounded-full border border-red-400/40 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-red-300 disabled:opacity-40"
            >
              {busy === code.id ? 'Revoking...' : 'Revoke'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-[1rem] border border-white/12 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-white/40">Guest codes</div>
      <p className="mt-1 text-xs text-white/45">
        One code per stay. Give it the guest&rsquo;s name and the day they leave, and it stops working
        on its own.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Who is it for? e.g. Ahmed, unit 12"
          className={fieldClass}
        />
        <input
          type="date"
          value={expiresOn}
          onChange={(event) => setExpiresOn(event.target.value)}
          className={fieldClass}
        />
        <button
          type="button"
          onClick={create}
          disabled={busy !== null}
          className="btn-gold rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-50"
        >
          {busy === 'create' ? 'Creating...' : 'New code'}
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-white/35">
        Leave the date empty for a code that never expires — owners, or your own staff.
      </p>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

      <div className="mt-4 space-y-2">
        {live.length === 0 ? (
          <p className="rounded-[0.9rem] border border-white/10 bg-black/20 px-4 py-5 text-center text-sm text-white/45">
            No live codes. Create one to share with a guest.
          </p>
        ) : (
          live.map(row)
        )}
      </div>

      {finished.length > 0 ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs uppercase tracking-[0.16em] text-white/35">
            {finished.length} finished {finished.length === 1 ? 'code' : 'codes'}
          </summary>
          <div className="mt-2 space-y-2">{finished.map(row)}</div>
        </details>
      ) : null}

      {live.length > 0 ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={revokeAll}
            disabled={busy !== null}
            className="rounded-full border border-red-400/40 px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-red-300 disabled:opacity-50"
          >
            {busy === 'all' ? 'Cutting off...' : 'Cut off everyone'}
          </button>
          <p className="mt-2 text-[11px] leading-relaxed text-white/40">
            Revoking one code affects only that guest. <strong className="text-white/60">Cut off everyone</strong>{' '}
            ends every code here at once. Either way a phone loses the list the next time it is online —
            a guest with no signal keeps it until then.
          </p>
        </div>
      ) : null}
    </div>
  );
}
