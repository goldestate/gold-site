'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { CompoundSuggestion } from '@/lib/compound-suggestions';
import { LOCATIONS, type LocationValue } from '@/lib/property-taxonomy';

const fieldClass =
  'w-full rounded-[0.7rem] border border-white/12 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#D9B355]';

type Draft = { nameEn: string; nameAr: string; location: LocationValue };

/**
 * The compounds already present in GOLD's listings, offered as one tap each.
 *
 * The name, the region and every spelling staff have used are all in the
 * listing data, so none of it needs typing again -- and the spellings become
 * the compound's match names, which is the field people forget and only notice
 * months later when a guest opens an empty directory.
 *
 * Each row is created on its own. Nothing here merges two names: "Marassi" and
 * "Marassi Marina" arrive as two compounds because that is how staff entered
 * them, and joining them is a deliberate edit afterwards.
 */
export function CompoundSuggestions({ suggestions }: { suggestions: CompoundSuggestion[] }) {
  const router = useRouter();
  const pending = suggestions.filter((item) => !item.exists);

  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(
      pending.map((item) => [item.slug, { nameEn: item.nameEn, nameAr: '', location: item.location }])
    )
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = pending.filter((item) => !dismissed.has(item.slug));

  if (visible.length === 0) return null;

  const create = async (item: CompoundSuggestion) => {
    const draft = drafts[item.slug];
    if (!draft?.nameEn.trim()) return false;
    const res = await fetch('/api/directory/compounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nameEn: draft.nameEn.trim(),
        nameAr: draft.nameAr.trim(),
        location: draft.location,
        // Every spelling staff have used, so listings under any of them resolve
        // here. The edited display name is included in case they renamed it.
        matchNames: Array.from(new Set([draft.nameEn.trim(), ...item.variants]))
      })
    });
    return res.ok;
  };

  const createOne = async (item: CompoundSuggestion) => {
    setBusy(item.slug);
    setError('');
    const ok = await create(item);
    setBusy(null);
    if (!ok) {
      setError(`Could not add ${drafts[item.slug]?.nameEn ?? item.nameEn}.`);
      return;
    }
    router.refresh();
  };

  const createAll = async () => {
    setBulk(true);
    setError('');
    let failed = 0;
    for (const item of visible) {
      // Sequential on purpose: slugs are unique in the table, and firing them
      // together turns one clash into a pile of unexplained failures.
      if (!(await create(item))) failed += 1;
    }
    setBulk(false);
    if (failed > 0) setError(`${failed} could not be added. The rest were.`);
    router.refresh();
  };

  const patch = (slug: string, change: Partial<Draft>) =>
    setDrafts((current) => ({ ...current, [slug]: { ...current[slug], ...change } }));

  return (
    <div className="mt-8 rounded-[1rem] border border-[rgba(217,179,85,0.3)] bg-[rgba(217,179,85,0.05)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[#D9B355]">From your listings</div>
          <p className="mt-1 max-w-lg text-sm text-white/60">
            {visible.length} {visible.length === 1 ? 'compound is' : 'compounds are'} already in your
            property listings but not in the directory. Names, regions and spellings come straight
            from the listings — nothing here changes them.
          </p>
        </div>
        <button
          type="button"
          onClick={createAll}
          disabled={bulk || busy !== null}
          className="btn-gold rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-50"
        >
          {bulk ? 'Adding...' : `Add all ${visible.length}`}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

      <div className="mt-4 space-y-2">
        {visible.map((item) => {
          const draft = drafts[item.slug];
          return (
            <div key={item.slug} className="rounded-[0.9rem] border border-white/12 bg-black/25 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">
                  {item.listingCount} {item.listingCount === 1 ? 'listing' : 'listings'}
                </span>
                <button
                  type="button"
                  onClick={() => setDismissed((current) => new Set(current).add(item.slug))}
                  className="text-[11px] uppercase tracking-[0.16em] text-white/35 transition hover:text-white/60"
                >
                  Not a compound
                </button>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center">
                <input
                  value={draft.nameEn}
                  onChange={(event) => patch(item.slug, { nameEn: event.target.value })}
                  className={fieldClass}
                />
                <select
                  value={draft.location}
                  onChange={(event) => patch(item.slug, { location: event.target.value as LocationValue })}
                  className={fieldClass}
                >
                  {LOCATIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#231F20]">
                      {option.en}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => createOne(item)}
                  disabled={busy !== null || bulk || !draft.nameEn.trim()}
                  className="rounded-full border border-[#D9B355] px-5 py-2 text-xs uppercase tracking-[0.18em] text-[#D9B355] disabled:opacity-40"
                >
                  {busy === item.slug ? 'Adding...' : 'Add'}
                </button>
              </div>

              <input
                value={draft.nameAr}
                onChange={(event) => patch(item.slug, { nameAr: event.target.value })}
                placeholder="الاسم بالعربية (optional)"
                dir="rtl"
                className={`mt-2 ${fieldClass}`}
              />

              <p className="mt-2 text-[11px] leading-relaxed text-white/40">
                Matches listings named:{' '}
                <span className="text-white/60">{item.variants.join(', ')}</span>
              </p>

              {item.otherLocations.length > 0 ? (
                <p className="mt-1 text-[11px] leading-relaxed text-[#D9A441]">
                  Listings under this name sit in more than one region (
                  {[item.location, ...item.otherLocations]
                    .map((value) => LOCATIONS.find((option) => option.value === value)?.en ?? value)
                    .join(', ')}
                  ). Check this is one place before adding it.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
