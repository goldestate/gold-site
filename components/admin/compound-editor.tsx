'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Compound, CompoundCode, Place } from '@/lib/directory-store';
import {
  PLACE_CATEGORIES,
  defaultTierFor,
  placeCategoryLabel,
  type PlaceCategoryValue,
  type PlaceTierValue
} from '@/lib/directory-taxonomy';
import { PasteImport } from './paste-import';
import { CodePanel } from './code-panel';

const fieldClass =
  'w-full rounded-[0.8rem] border border-white/12 bg-white/5 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/30 focus:border-[#D9B355]';

export function CompoundEditor({
  compound,
  places,
  codes,
  otherCompounds
}: {
  compound: Compound;
  places: Place[];
  codes: CompoundCode[];
  otherCompounds: { id: string; nameEn: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState<PlaceCategoryValue | null>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [matchNames, setMatchNames] = useState(
    (compound.matchNames.length > 0 ? compound.matchNames : [compound.nameEn]).join(', ')
  );
  const [matchSaved, setMatchSaved] = useState(false);

  const saveMatchNames = async () => {
    setBusy(true);
    const res = await fetch('/api/directory/compounds', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: compound.id,
        matchNames: matchNames.split(',').map((item) => item.trim())
      })
    });
    setBusy(false);
    if (res.ok) {
      setMatchSaved(true);
      setTimeout(() => setMatchSaved(false), 2500);
      refresh();
    }
  };

  const filled = new Set(places.filter((place) => place.active).map((place) => place.category));
  const missing = PLACE_CATEGORIES.filter((item) => !filled.has(item.value));
  const percent = Math.round((filled.size / PLACE_CATEGORIES.length) * 100);

  const refresh = () => router.refresh();

  const addPlace = async (category: PlaceCategoryValue) => {
    if (!newName.trim()) return;
    setBusy(true);
    await fetch('/api/directory/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compoundId: compound.id,
        places: [
          {
            category,
            tier: defaultTierFor(category),
            nameEn: newName.trim(),
            phone: newPhone.trim() || null,
            whatsapp: newPhone.trim() || null,
            sortOrder: 0
          }
        ]
      })
    });
    setBusy(false);
    setNewName('');
    setNewPhone('');
    setAdding(null);
    refresh();
  };

  const toggleTier = async (place: Place) => {
    const next: PlaceTierValue = place.tier === 'public' ? 'vetted' : 'public';
    setBusy(true);
    await fetch(`/api/directory/places/${place.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: next })
    });
    setBusy(false);
    refresh();
  };

  const removePlace = async (place: Place) => {
    if (!window.confirm(`Delete "${place.nameEn}"?`)) return;
    setBusy(true);
    await fetch(`/api/directory/places/${place.id}`, { method: 'DELETE' });
    setBusy(false);
    refresh();
  };

  const copyFrom = async (sourceId: string) => {
    if (!sourceId) return;
    setBusy(true);
    const res = await fetch(`/api/directory/places?compoundId=${sourceId}`);
    if (res.ok) {
      const { places: source } = (await res.json()) as { places: Place[] };
      // Only public amenities carry over. Vetted rows are GOLD's own trades and are
      // compound-specific, so copying them would put the wrong plumber on the list.
      const carry = source.filter((item) => item.tier === 'public' && item.active);
      if (carry.length > 0) {
        await fetch('/api/directory/places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            compoundId: compound.id,
            places: carry.map((item) => ({
              category: item.category,
              tier: 'public',
              nameEn: item.nameEn,
              nameAr: item.nameAr,
              phone: item.phone,
              whatsapp: item.whatsapp,
              address: item.address,
              sortOrder: item.sortOrder
            }))
          })
        });
      }
    }
    setBusy(false);
    refresh();
  };

  const grouped = PLACE_CATEGORIES.map((category) => ({
    category,
    items: places.filter((place) => place.category === category.value)
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-5">
      {/* progress -- turns an open-ended chore into a finish line */}
      <div className="rounded-[1rem] border border-white/12 bg-white/5 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">
            {filled.size} of {PLACE_CATEGORIES.length} categories
          </span>
          <span className="text-[#D9B355]">{percent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#D9B355] transition-all" style={{ width: `${percent}%` }} />
        </div>
        {missing.length > 0 ? (
          <>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/40">Still empty - tap to add</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {missing.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setAdding(item.value)}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/60 transition active:scale-95 hover:border-[#D9B355] hover:text-[#D9B355]"
                >
                  {item.en}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-3 text-xs text-[#D9B355]">Every category has at least one entry.</p>
        )}
      </div>

      {/* inline add sheet */}
      {adding ? (
        <div className="space-y-2 rounded-[1rem] border border-[rgba(217,179,85,0.4)] bg-[rgba(217,179,85,0.06)] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[#D9B355]">
            Add {placeCategoryLabel(adding, 'en')}
          </div>
          <input
            autoFocus
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Name"
            className={fieldClass}
          />
          <input
            value={newPhone}
            onChange={(event) => setNewPhone(event.target.value)}
            placeholder="Phone"
            inputMode="tel"
            className={fieldClass}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addPlace(adding)}
              disabled={busy || !newName.trim()}
              className="btn-gold flex-1 rounded-full py-3 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-40"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setAdding(null)}
              className="rounded-full border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.18em] text-white/60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <PasteImport compoundId={compound.id} onDone={refresh} />

      {otherCompounds.length > 0 ? (
        <select
          onChange={(event) => {
            copyFrom(event.target.value);
            event.target.value = '';
          }}
          defaultValue=""
          className={fieldClass}
        >
          <option value="" className="bg-[#231F20]">
            Copy public places from...
          </option>
          {otherCompounds.map((item) => (
            <option key={item.id} value={item.id} className="bg-[#231F20]">
              {item.nameEn}
            </option>
          ))}
        </select>
      ) : null}

      {/* the list */}
      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.category.value}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-[0.18em] text-white/40">{group.category.en}</h2>
              <button
                type="button"
                onClick={() => setAdding(group.category.value)}
                className="text-xs text-white/40 transition hover:text-[#D9B355]"
              >
                + Add
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {group.items.map((place) => (
                <div key={place.id} className="rounded-[0.9rem] border border-white/10 bg-white/5 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm text-white">{place.nameEn}</div>
                      {place.phone ? (
                        <a href={`tel:${place.phone}`} className="font-mono text-xs text-[#D9B355]">
                          {place.phone}
                        </a>
                      ) : (
                        <span className="text-xs text-white/30">no phone</span>
                      )}
                    </div>
                    <div className="flex flex-none items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleTier(place)}
                        disabled={busy}
                        className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] transition ${
                          place.tier === 'vetted'
                            ? 'border-[#D9B355] text-[#D9B355]'
                            : 'border-white/15 text-white/45'
                        }`}
                      >
                        {place.tier === 'vetted' ? 'Code' : 'Public'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removePlace(place)}
                        disabled={busy}
                        className="px-1.5 text-white/30"
                        aria-label="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* which listings belong to this compound */}
      <div className="rounded-[1rem] border border-white/12 bg-white/5 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-white/40">Matches listings named</div>
        <input
          value={matchNames}
          onChange={(event) => {
            setMatchNames(event.target.value);
            setMatchSaved(false);
          }}
          className={`mt-2 ${fieldClass}`}
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={saveMatchNames}
            disabled={busy || !matchNames.trim()}
            className="rounded-full border border-white/20 px-5 py-2.5 text-xs uppercase tracking-[0.18em] text-white disabled:opacity-40"
          >
            {matchSaved ? 'Saved' : 'Save names'}
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-white/40">
          Comma separated. This is the compound part of a listing name &mdash; everything before the first
          dash. Add every spelling that should land here, so Marassi also lists{' '}
          <strong className="text-white/60">Marassi Marina</strong>. Capitalisation and punctuation do not
          matter.
        </p>
      </div>

      <CodePanel compoundId={compound.id} compoundName={compound.nameEn} codes={codes} />

    </div>
  );
}
