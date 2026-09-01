'use client';

import { useState } from 'react';
import {
  PLACE_CATEGORIES,
  PLACE_TIERS,
  defaultTierFor,
  type PlaceCategoryValue,
  type PlaceTierValue
} from '@/lib/directory-taxonomy';

export type ParsedRow = { nameEn: string; phone: string | null };

/**
 * Parses a pasted blob, one entry per line. The data arrives as messy WhatsApp
 * text, so this is deliberately loose: the LAST phone-shaped run of digits on a
 * line is the number and everything else is the name. It is never written
 * straight to the database -- the caller always shows an editable preview first.
 */
export function parseLines(raw: string): ParsedRow[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const matches = [...line.matchAll(/(\+?\d[\d\s\-()]{6,}\d)/g)];
      if (matches.length === 0) return { nameEn: line.replace(/[\s\-–—:,]+$/, '').trim(), phone: null };
      const last = matches[matches.length - 1];
      const phone = last[0].replace(/[\s\-()]/g, '');
      const nameEn = (line.slice(0, last.index ?? 0) + line.slice((last.index ?? 0) + last[0].length))
        .replace(/[\s\-–—:,]+$/, '')
        .replace(/^[\s\-–—:,]+/, '')
        .trim();
      return { nameEn: nameEn || phone, phone };
    });
}

const fieldClass =
  'w-full rounded-[0.8rem] border border-white/12 bg-white/5 px-3 py-2.5 text-base text-white outline-none focus:border-[#D9B355]';

export function PasteImport({
  compoundId,
  onDone
}: {
  compoundId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<PlaceCategoryValue>(PLACE_CATEGORIES[0].value);
  const [tier, setTier] = useState<PlaceTierValue>(defaultTierFor(PLACE_CATEGORIES[0].value));
  const [raw, setRaw] = useState('');
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pickCategory = (value: PlaceCategoryValue) => {
    setCategory(value);
    setTier(defaultTierFor(value));
  };

  const save = async () => {
    if (!preview || preview.length === 0) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/directory/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compoundId,
        places: preview
          .filter((row) => row.nameEn.trim().length > 0)
          .map((row, index) => ({
            category,
            tier,
            nameEn: row.nameEn.trim(),
            phone: row.phone,
            whatsapp: row.phone,
            sortOrder: index
          }))
      })
    });
    setBusy(false);
    if (!res.ok) {
      setError('Could not save these entries.');
      return;
    }
    setRaw('');
    setPreview(null);
    setOpen(false);
    onDone();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-[1rem] border border-dashed border-white/20 py-3.5 text-sm uppercase tracking-[0.16em] text-white/60 transition active:scale-[0.99] hover:border-[#D9B355] hover:text-[#D9B355]"
      >
        Paste a list
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-[1rem] border border-white/12 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-[#D9B355]">Paste a list</div>

      <select
        value={category}
        onChange={(event) => pickCategory(event.target.value as PlaceCategoryValue)}
        className={fieldClass}
      >
        {PLACE_CATEGORIES.map((item) => (
          <option key={item.value} value={item.value} className="bg-[#231F20]">
            {item.en}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        {PLACE_TIERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setTier(item.value)}
            className={`flex-1 rounded-[0.8rem] border px-3 py-2.5 text-xs uppercase tracking-[0.14em] transition ${
              tier === item.value
                ? 'border-[#D9B355] bg-[rgba(217,179,85,0.14)] text-[#D9B355]'
                : 'border-white/12 text-white/50'
            }`}
          >
            {item.value === 'public' ? 'Public' : 'Needs code'}
          </button>
        ))}
      </div>

      {preview === null ? (
        <>
          <textarea
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            rows={6}
            placeholder={'One per line, e.g.\nAhmed the plumber 01001234567\nCity Pharmacy - 0122 555 4433'}
            className={fieldClass}
          />
          <button
            type="button"
            onClick={() => setPreview(parseLines(raw))}
            disabled={!raw.trim()}
            className="btn-gold w-full rounded-full py-3 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-40"
          >
            Preview
          </button>
        </>
      ) : (
        <>
          <p className="text-xs text-white/50">
            Check these before saving. Tap any field to fix it.
          </p>
          <div className="space-y-2">
            {preview.map((row, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={row.nameEn}
                  onChange={(event) =>
                    setPreview((prev) =>
                      prev!.map((item, i) => (i === index ? { ...item, nameEn: event.target.value } : item))
                    )
                  }
                  className={`${fieldClass} flex-1`}
                />
                <input
                  value={row.phone ?? ''}
                  onChange={(event) =>
                    setPreview((prev) =>
                      prev!.map((item, i) => (i === index ? { ...item, phone: event.target.value || null } : item))
                    )
                  }
                  placeholder="phone"
                  inputMode="tel"
                  className={`${fieldClass} w-32 flex-none font-mono text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setPreview((prev) => prev!.filter((_, i) => i !== index))}
                  className="flex-none rounded-[0.8rem] border border-white/12 px-3 text-white/40"
                  aria-label="Remove line"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="btn-gold flex-1 rounded-full py-3 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-50"
            >
              {busy ? 'Saving...' : `Save ${preview.length}`}
            </button>
            <button
              type="button"
              onClick={() => setPreview(null)}
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
