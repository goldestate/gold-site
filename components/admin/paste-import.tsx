'use client';

import { useState } from 'react';
import type { Place } from '@/lib/directory-store';
import {
  PLACE_CATEGORIES,
  currentAppNote,
  defaultTierFor,
  guessCategory,
  placeKey,
  tierLabel,
  type PlaceCategoryValue,
  type PlaceTierValue
} from '@/lib/directory-taxonomy';
import { cleanPhone, extractLine, isEgyptianMobile, whatsappFor } from '@/lib/phone';
import { adminFetch } from '@/lib/admin-fetch';

export type ParsedRow = {
  /** The pasted line, so re-previewing edited text keeps the edits made to lines that did not change. */
  source: string;
  nameEn: string;
  phone: string | null;
  whatsapp: string | null;
  category: PlaceCategoryValue | null;
  /** Null follows the category's default tier; set once staff tap the chip. */
  tier: PlaceTierValue | null;
  /** Null means the default -- in, unless it duplicates a place already here. */
  include: boolean | null;
};

/**
 * Parses a pasted blob, one entry per line. The data arrives as messy WhatsApp
 * text: extractLine separates the name from the numbers (two numbers on a line,
 * a 19xxx hotline, Arabic-Indic digits) and only keeps a WhatsApp number that can
 * be one. The category is guessed per line, because a list forwarded on WhatsApp
 * mixes the pharmacy with the plumber. It is never written straight to the
 * database -- the caller always shows an editable preview first.
 */
export function parseLines(raw: string): ParsedRow[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const { name, phone, whatsapp } = extractLine(line);
      return { source: line, nameEn: name, phone, whatsapp, category: guessCategory(line), tier: null, include: null };
    });
}

/**
 * Whether a parsed number has a shape real ones have here: a mobile, a landline,
 * a 15xxx-19xxx hotline, or + / 00 international. extractLine keeps a building
 * or unit number in front of a phone out of it ("Building 12 - 0100 123 4567"),
 * but pasted text has more shapes than it knows, so the preview flags anything
 * else, with the pasted line beside it, instead of letting it save quietly.
 */
function plausiblePhone(phone: string): boolean {
  const cleaned = cleanPhone(phone);
  // 20 with no + or 00 before it does not dial from inside Egypt, and it is
  // usually a stray digit glued on: "Ahmed 2 0100 123 4567".
  if (cleaned.startsWith('20')) return false;
  if (isEgyptianMobile(cleaned)) return true;
  if (/^1[5-9]\d{3}$/.test(cleaned)) return true;
  if (/^0(?:2\d{8}|3\d{7}|[4-9]\d{8})$/.test(cleaned)) return true;
  const international = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned.startsWith('00') ? cleaned.slice(2) : null;
  return international !== null && /^[1-9]\d{7,14}$/.test(international);
}

/** Private until a category says otherwise: an unsorted line is more likely a person than a shop. */
function tierOf(row: ParsedRow): PlaceTierValue {
  return row.tier ?? (row.category ? defaultTierFor(row.category) : 'vetted');
}

const fieldClass =
  'w-full rounded-[0.8rem] border border-white/12 bg-white/5 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/30 focus:border-[#D9B355]';

export function PasteImport({
  compoundId,
  existing,
  onDone
}: {
  compoundId: string;
  /** Every place already in this compound, hidden ones included, so a re-pasted list does not list them twice. */
  existing: Pick<Place, 'category' | 'nameEn'>[];
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState('');
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  // The text the preview was built from. Back keeps the preview; previewing the
  // same text again shows it exactly as staff left it.
  const [previewedFrom, setPreviewedFrom] = useState('');
  const [showing, setShowing] = useState<'text' | 'preview'>('text');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // What the last save did, shown under the closed panel so skipped rows are not a mystery.
  const [savedNote, setSavedNote] = useState('');

  const here = new Set(existing.map(placeKey));
  const rows = preview ?? [];

  /** Why a row repeats something, or null. Only a named, categorised row can repeat anything. */
  const duplicateOf = (index: number): string | null => {
    const row = rows[index];
    if (!row.category || !row.nameEn.trim()) return null;
    const key = placeKey({ category: row.category, nameEn: row.nameEn });
    if (here.has(key)) return 'Already on this list';
    if (rows.slice(0, index).some((other) => other.category && placeKey({ category: other.category, nameEn: other.nameEn }) === key)) {
      return 'Pasted twice';
    }
    return null;
  };
  const included = (index: number) => rows[index].include ?? duplicateOf(index) === null;

  const toSave = rows.filter((row, index) => row.nameEn.trim().length > 0 && included(index));
  const unsorted = toSave.filter((row) => row.category === null).length;
  const publicCount = toSave.filter((row) => tierOf(row) === 'public').length;
  const unseenCount = toSave.filter((row) => row.category && currentAppNote(row.category, tierOf(row))).length;
  const leftOut = rows.length - toSave.length;

  const updateRow = (index: number, patch: Partial<ParsedRow>) =>
    setPreview((prev) => prev!.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const setPhone = (index: number, value: string) =>
    setPreview((prev) =>
      prev!.map((item, i) => {
        if (i !== index) return item;
        const phone = value.trim() ? value : null;
        // A WhatsApp that came from this same number follows it; a separate
        // mobile found after a landline stays put.
        const followsPhone = item.whatsapp === null || item.whatsapp === whatsappFor(item.phone);
        return { ...item, phone, whatsapp: followsPhone ? whatsappFor(phone) : item.whatsapp };
      })
    );

  const showPreview = () => {
    if (preview && raw === previewedFrom) {
      setShowing('preview');
      return;
    }
    // Text changed: lines that are still there keep their edits, new ones are parsed.
    const pool = [...(preview ?? [])];
    const next = parseLines(raw).map((row) => {
      const match = pool.findIndex((old) => old.source === row.source);
      return match === -1 ? row : pool.splice(match, 1)[0];
    });
    setPreview(next);
    setPreviewedFrom(raw);
    setShowing('preview');
  };

  const reset = () => {
    setRaw('');
    setPreview(null);
    setPreviewedFrom('');
    setShowing('text');
    setError('');
    setOpen(false);
  };

  const cancel = () => {
    if (raw.trim() && !window.confirm('Discard this list?')) return;
    reset();
  };

  const save = async () => {
    if (toSave.length === 0 || unsorted > 0) return;
    setBusy(true);
    setError('');
    const result = await adminFetch<{ places: Place[]; skipped?: number }>('/api/directory/places', {
      method: 'POST',
      body: {
        compoundId,
        // The server drops rows already listed, in case this list was saved from
        // another tab since the page was drawn; "Add anyway" rows go in regardless.
        skipExisting: true,
        places: toSave.map((row, index) => ({
          category: row.category,
          tier: tierOf(row),
          nameEn: row.nameEn.trim(),
          phone: row.phone,
          whatsapp: row.whatsapp,
          sortOrder: index,
          allowDuplicate: row.include === true
        }))
      }
    });
    setBusy(false);
    if (!result.ok) {
      // The preview stays exactly as it is, so a retry is one tap.
      setError(result.error);
      return;
    }
    const saved = result.data.places.length;
    const skipped = result.data.skipped ?? 0;
    reset();
    setSavedNote(
      `Saved ${saved}.${skipped > 0 ? ` ${skipped} already on the list ${skipped === 1 ? 'was' : 'were'} skipped.` : ''}`
    );
    onDone();
  };

  if (!open) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setSavedNote('');
          }}
          className="w-full rounded-[1rem] border border-dashed border-white/20 py-3.5 text-sm uppercase tracking-[0.16em] text-white/60 transition active:scale-[0.99] hover:border-[#D9B355] hover:text-[#D9B355]"
        >
          Paste a list
        </button>
        {savedNote ? <p className="text-xs text-white/50">{savedNote}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-[1rem] border border-white/12 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-[#D9B355]">Paste a list</div>

      {showing === 'text' || preview === null ? (
        <>
          <textarea
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            rows={6}
            placeholder={'One per line, e.g.\nAhmed the plumber 01001234567\nCity Pharmacy - 0122 555 4433'}
            className={fieldClass}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={showPreview}
              disabled={!raw.trim()}
              className="btn-gold flex-1 rounded-full py-3 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-40"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-full border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.18em] text-white/60"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs leading-relaxed text-white/50">
            Check these before saving. Tap any field to fix it, and tap Public or Private to change who can get
            the number. Public is for numbers anyone could look up, like shops and clinics. Private is for
            GOLD&rsquo;s own people and this compound&rsquo;s contacts: only phones holding a live code get them.
          </p>
          <div className="space-y-2">
            {rows.map((row, index) => {
              const duplicate = duplicateOf(index);
              const isIn = included(index);
              const tier = tierOf(row);
              const appNote = row.category ? currentAppNote(row.category, tier) : null;
              const oddPhone = row.phone !== null && !plausiblePhone(row.phone);
              return (
                <div
                  key={index}
                  className={`space-y-2 rounded-[0.9rem] border p-2.5 ${isIn ? 'border-white/10' : 'border-dashed border-white/10'}`}
                >
                  <div className={`space-y-2 ${isIn ? '' : 'opacity-50'}`}>
                    <div className="flex gap-2">
                      <input
                        value={row.nameEn}
                        onChange={(event) => updateRow(index, { nameEn: event.target.value })}
                        placeholder="Name"
                        className={`${fieldClass} min-w-0 flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => setPreview((prev) => prev!.filter((_, i) => i !== index))}
                        className="h-11 w-11 flex-none rounded-[0.8rem] border border-white/12 text-lg text-white/40"
                        aria-label="Remove line"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={row.phone ?? ''}
                        onChange={(event) => setPhone(index, event.target.value)}
                        placeholder="phone"
                        inputMode="tel"
                        className={`${fieldClass} min-w-0 flex-1 font-mono`}
                      />
                      <button
                        type="button"
                        onClick={() => updateRow(index, { tier: tier === 'public' ? 'vetted' : 'public' })}
                        aria-label={`${tierLabel(tier)}. Tap to make it ${tier === 'public' ? 'private' : 'public'}.`}
                        className={`min-h-[44px] w-24 flex-none rounded-full border text-[11px] uppercase tracking-[0.14em] transition active:scale-95 ${
                          tier === 'public'
                            ? 'border-[#E8C27A]/60 bg-[#E8C27A]/10 text-[#E8C27A]'
                            : 'border-[#D9B355] text-[#D9B355]'
                        }`}
                      >
                        {tierLabel(tier)}
                      </button>
                    </div>
                    <select
                      value={row.category ?? ''}
                      onChange={(event) => updateRow(index, { category: event.target.value as PlaceCategoryValue })}
                      className={fieldClass}
                    >
                      <option value="" disabled className="bg-[#231F20]">
                        Pick a category
                      </option>
                      {PLACE_CATEGORIES.map((item) => (
                        <option key={item.value} value={item.value} className="bg-[#231F20]">
                          {item.en}
                        </option>
                      ))}
                    </select>
                    {oddPhone ? (
                      <p className="text-[11px] leading-relaxed text-[#E8C27A]">
                        Check this number. The pasted line was:{' '}
                        <span className="break-words font-mono text-white/60">{row.source}</span>
                      </p>
                    ) : null}
                    {appNote ? <p className="text-[11px] leading-relaxed text-[#E8C27A]">{appNote}</p> : null}
                    <p className="text-[11px] text-white/40">
                      {row.whatsapp ? (
                        <>
                          WhatsApp <span className="font-mono">{row.whatsapp}</span>
                        </>
                      ) : row.phone ? (
                        'No WhatsApp - not a mobile number'
                      ) : (
                        'No number'
                      )}
                    </p>
                  </div>
                  {duplicate ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[#E8C27A]">
                        {duplicate}
                        {isIn ? '' : ' - left out'}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateRow(index, { include: !isIn })}
                        className="min-h-[40px] rounded-full border border-white/15 px-4 text-[11px] uppercase tracking-[0.14em] text-white/60"
                      >
                        {isIn ? 'Leave out' : 'Add anyway'}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {toSave.length > 0 ? (
            <p className="text-xs leading-relaxed text-white/60">
              {publicCount > 0 ? (
                <>
                  <span className="text-[#E8C27A]">
                    {publicCount} of {toSave.length} will be public
                  </span>{' '}
                  - anyone can look these up, with or without a code.
                  {publicCount < toSave.length ? ' The rest are private.' : ''}
                </>
              ) : (
                <>All {toSave.length} will be private - only phones holding a live code get them.</>
              )}
              {leftOut > 0 ? ` ${leftOut} left out.` : ''}
              {unseenCount > 0 ? (
                <span className="text-[#E8C27A]">
                  {' '}
                  {unseenCount} will not show on the current app version until its next update.
                </span>
              ) : null}
            </p>
          ) : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={busy || toSave.length === 0 || unsorted > 0}
              className="btn-gold flex-1 rounded-full py-3 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-50"
            >
              {busy ? 'Saving...' : unsorted > 0 ? `${unsorted} need a category` : `Save ${toSave.length}`}
            </button>
            <button
              type="button"
              onClick={() => setShowing('text')}
              disabled={busy}
              className="rounded-full border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.18em] text-white/60"
            >
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
}
