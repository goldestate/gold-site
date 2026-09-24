'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { CompoundCode } from '@/lib/directory-store';
import { adminFetch } from '@/lib/admin-fetch';
import { inviteMessage, whatsappComposeUrl } from '@/lib/app-links';
import { cairoToday, codeLastDay, formatCodeLastDay } from '@/lib/cairo-time';

const fieldClass =
  'w-full rounded-[0.8rem] border border-white/12 bg-white/5 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/30 focus:border-[#D9B355] disabled:opacity-40';

const rowButton =
  'inline-flex min-h-[40px] items-center rounded-full border px-4 text-[11px] uppercase tracking-[0.16em] disabled:opacity-40';

type Status = { text: string; tone: 'live' | 'ending' | 'over' };

/**
 * A code per stay, each with its own end date.
 *
 * Two guests at the same compound leaving on different days need two codes at
 * once, which is why creating one no longer ends the others. A code with an end
 * date needs no action when the stay finishes: it stops being redeemable, and
 * the devices that used it lose the list on their next launch.
 *
 * Dates are Cairo calendar days everywhere -- picked, stored and shown -- so the
 * day staff choose is the day they read back, on the server render and on the
 * phone alike.
 */
function statusOf(code: CompoundCode, now: number): Status {
  if (!code.active) return { text: 'Revoked', tone: 'over' };
  if (!code.expiresAt) return { text: 'No end date', tone: 'live' };

  const ends = new Date(code.expiresAt);
  const label = formatCodeLastDay(code.expiresAt);
  if (ends.getTime() <= now) return { text: `Ended ${label}`, tone: 'over' };

  const days = Math.ceil((ends.getTime() - now) / 86_400_000);
  return { text: days <= 2 ? `Ends ${label} (${days}d)` : `Ends ${label}`, tone: days <= 2 ? 'ending' : 'live' };
}

const toneClass: Record<Status['tone'], string> = {
  live: 'text-[#8FAE78]',
  ending: 'text-[#D9A441]',
  over: 'text-white/35'
};

/**
 * Where an error belongs: 'create' (the new-code form), 'list' (above the live
 * codes), 'all' (the cut-off button) or a code's id (its row). A code that
 * turns out to be gone reports at 'list': the refresh that follows moves it
 * into the collapsed finished list, and a row message would go with it.
 */
type PanelError = { scope: string; text: string } | null;

export function CodePanel({
  compoundId,
  compoundName,
  compoundNameAr,
  codes
}: {
  compoundId: string;
  /** English name, for the invite's English half. */
  compoundName: string;
  /** Arabic name, for the invite's Arabic half. Falls back to the English one. */
  compoundNameAr?: string;
  codes: CompoundCode[];
}) {
  const router = useRouter();
  // What is in flight: 'create', 'all', or `revoke:<id>` / `extend:<id>`. Scoped
  // per action so each button names its own work -- one shared id made Save
  // read "Saving..." while that row was being revoked.
  const [busy, setBusy] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [noEnd, setNoEnd] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<PanelError>(null);
  // The code whose end date is open for editing, and the day picked for it.
  const [editing, setEditing] = useState<{ id: string; day: string } | null>(null);

  // Fixed at render rather than ticking: a countdown that moves while staff read
  // it buys nothing, and the server is what actually decides.
  const now = Date.now();
  const today = cairoToday();
  const live = codes.filter((code) => statusOf(code, now).tone !== 'over');
  const finished = codes.filter((code) => statusOf(code, now).tone === 'over');

  const post = (body: Record<string, unknown>) =>
    adminFetch('/api/directory/codes', { method: 'POST', body });

  const errorFor = (scope: string) =>
    error?.scope === scope ? <p className="mt-2 text-sm text-red-300">{error.text}</p> : null;

  const create = async () => {
    const name = label.trim();
    if (!name) {
      setError({ scope: 'create', text: 'Name the code first. The unit and the dates are enough.' });
      return;
    }
    if (!noEnd && !expiresOn) {
      setError({ scope: 'create', text: 'Pick the day the stay ends, or tick "No end date".' });
      return;
    }
    setBusy('create');
    setError(null);
    const result = await post({ action: 'create', compoundId, label: name, expiresOn: noEnd ? '' : expiresOn, noEnd });
    setBusy(null);
    if (!result.ok) {
      setError({ scope: 'create', text: result.error });
      return;
    }
    setLabel('');
    setExpiresOn('');
    setNoEnd(false);
    router.refresh();
  };

  const saveEndDate = async (code: CompoundCode) => {
    if (!editing || editing.id !== code.id) return;
    if (!editing.day) {
      setError({ scope: code.id, text: 'Pick the new last day of the stay.' });
      return;
    }
    setBusy(`extend:${code.id}`);
    setError(null);
    const result = await post({ action: 'extend', codeId: code.id, expiresOn: editing.day });
    setBusy(null);
    if (!result.ok) {
      if (result.status === 404) {
        // Revoked elsewhere: show the list as it now is, and say why it moved.
        setEditing(null);
        setError({ scope: 'list', text: `${code.code}: ${result.error}` });
        router.refresh();
        return;
      }
      setError({ scope: code.id, text: result.error });
      return;
    }
    setEditing(null);
    router.refresh();
  };

  const revoke = async (code: CompoundCode) => {
    const who = code.label || 'This guest';
    if (
      !window.confirm(
        `Revoke ${code.code}?\n\n${who}: every phone that used this code loses ${compoundName}'s directory the next time it is online. No other guest is affected.`
      )
    ) {
      return;
    }
    setBusy(`revoke:${code.id}`);
    setError(null);
    const result = await post({ action: 'revoke', codeId: code.id });
    setBusy(null);
    if (!result.ok) {
      if (result.status === 404) {
        if (editing?.id === code.id) setEditing(null);
        setError({ scope: 'list', text: `${code.code}: ${result.error}` });
        router.refresh();
        return;
      }
      setError({ scope: code.id, text: result.error });
      return;
    }
    router.refresh();
  };

  const revokeAll = async () => {
    if (
      !window.confirm(
        'Cut off everyone?\n\nEvery live code for this compound stops working and every guest loses its directory, including anyone mid-stay. To end one guest early, revoke just their code instead.'
      )
    ) {
      return;
    }
    setBusy('all');
    setError(null);
    const result = await post({ action: 'revokeAll', compoundId });
    setBusy(null);
    if (!result.ok) {
      setError({ scope: 'all', text: result.error });
      return;
    }
    router.refresh();
  };

  const copyInvite = async (code: CompoundCode) => {
    try {
      await navigator.clipboard.writeText(inviteMessage(code.code, compoundName, compoundNameAr));
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
    const isEditing = editing?.id === code.id;
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
              className={`${rowButton} border-white/20 text-white`}
            >
              {copied === code.id ? 'Copied' : copied === `failed:${code.id}` ? 'Copy failed' : 'Copy invite'}
            </button>
            <a
              href={whatsappComposeUrl(inviteMessage(code.code, compoundName, compoundNameAr))}
              target="_blank"
              rel="noopener noreferrer"
              className={`${rowButton} border-white/20 text-white`}
            >
              Send on WhatsApp
            </a>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setEditing(
                  isEditing ? null : { id: code.id, day: code.expiresAt ? codeLastDay(code.expiresAt) : '' }
                );
              }}
              disabled={busy !== null}
              className={`${rowButton} border-white/20 text-white`}
            >
              {code.expiresAt ? 'Change end date' : 'Set end date'}
            </button>
            <button
              type="button"
              onClick={() => revoke(code)}
              disabled={busy !== null}
              className={`${rowButton} border-red-400/40 text-red-300`}
            >
              {busy === `revoke:${code.id}` ? 'Revoking...' : 'Revoke'}
            </button>
          </div>
        )}

        {isEditing && !over ? (
          <div className="mt-3 rounded-[0.8rem] border border-white/10 bg-white/5 p-3">
            <label className="text-[11px] uppercase tracking-[0.16em] text-white/45" htmlFor={`end-${code.id}`}>
              Last day of the stay
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                id={`end-${code.id}`}
                type="date"
                min={today}
                value={editing.day}
                onChange={(event) => setEditing({ id: code.id, day: event.target.value })}
                className={`${fieldClass} min-w-0 flex-1`}
              />
              <button
                type="button"
                onClick={() => saveEndDate(code)}
                disabled={busy !== null}
                className="btn-gold min-h-[40px] rounded-full px-5 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-50"
              >
                {busy === `extend:${code.id}` ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setError(null);
                }}
                className="min-h-[40px] rounded-full border border-white/15 px-4 text-xs uppercase tracking-[0.18em] text-white/60"
              >
                Cancel
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-white/40">
              Same code and link, so there is nothing new to send. The code works until midnight Cairo
              time at the end of that day.
            </p>
          </div>
        ) : null}

        {errorFor(code.id)}
      </div>
    );
  };

  return (
    <div className="rounded-[1rem] border border-white/12 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-white/40">Guest codes</div>
      <p className="mt-1 text-xs text-white/45">
        One code per stay. Name it by unit and dates rather than the guest&rsquo;s name, pick the last
        day of the stay, and it stops working on its own at midnight Cairo time.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Unit 12 · 3–7 Oct"
          maxLength={120}
          aria-label="Code name"
          className={fieldClass}
        />
        <input
          type="date"
          min={today}
          value={noEnd ? '' : expiresOn}
          onChange={(event) => setExpiresOn(event.target.value)}
          disabled={noEnd}
          aria-label="Last day of the stay"
          className={fieldClass}
        />
        <button
          type="button"
          onClick={create}
          disabled={busy !== null}
          className="btn-gold min-h-[44px] rounded-full px-5 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-50"
        >
          {busy === 'create' ? 'Creating...' : 'New code'}
        </button>
      </div>
      <label className="mt-1 flex min-h-[40px] cursor-pointer items-center gap-3 text-sm text-white/60">
        <input
          type="checkbox"
          checked={noEnd}
          onChange={(event) => setNoEnd(event.target.checked)}
          className="h-5 w-5 flex-none accent-[#D9B355]"
        />
        No end date (owners/staff)
      </label>
      <p className="text-[11px] text-white/35">
        Only for owners or your own staff: a code with no end date keeps working until you revoke it.
      </p>

      {errorFor('create')}
      {errorFor('list')}

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
          <summary className="flex min-h-[40px] cursor-pointer items-center text-xs uppercase tracking-[0.16em] text-white/35">
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
            className="min-h-[44px] rounded-full border border-red-400/40 px-5 text-xs uppercase tracking-[0.18em] text-red-300 disabled:opacity-50"
          >
            {busy === 'all' ? 'Cutting off...' : 'Cut off everyone'}
          </button>
          {errorFor('all')}
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
