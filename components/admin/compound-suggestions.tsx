'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { CompoundSuggestion } from '@/lib/compound-suggestions';
import { adminFetch } from '@/lib/admin-fetch';
import { LOCATIONS, type LocationValue } from '@/lib/property-taxonomy';

const fieldClass =
  'w-full rounded-[0.7rem] border border-white/12 bg-white/5 px-3 py-2 text-base text-white outline-none transition placeholder:text-white/30 focus:border-[#D9B355]';

type Draft = { nameEn: string; nameAr: string; location: LocationValue };

/**
 * 'Not a compound' is remembered in this browser only. It is a convenience for
 * whoever keeps the directory, not shared data, and storing it server-side would
 * need a table (and a migration). Keyed by the suggestion's slug, so it survives
 * the listing being renamed in a way that slugifies the same.
 */
const DISMISSED_KEY = 'gold-admin:directory:not-a-compound';

function readDismissed(): Set<string> {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []);
  } catch {
    // Private mode, blocked storage or a corrupt value: start with nothing hidden.
    return new Set();
  }
}

function writeDismissed(slugs: Set<string>) {
  try {
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify([...slugs]));
  } catch {
    // Not remembered past this visit, which is the old behaviour.
  }
}

/** A suggestion that arrived after mount (a refresh brought it) has no draft yet. */
const defaultDraft = (item: CompoundSuggestion): Draft => ({ nameEn: item.nameEn, nameAr: '', location: item.location });

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
 * them. To join them instead, add "Marassi Marina" to Marassi's match names;
 * the suggestion then disappears for good.
 */
export function CompoundSuggestions({ suggestions }: { suggestions: CompoundSuggestion[] }) {
  const router = useRouter();
  const pending = suggestions.filter((item) => !item.exists);

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);
  const [error, setError] = useState('');
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  // Null until localStorage has been read after mount. Rendering before that
  // would show rows that then vanish, and an 'Add all' count that changes.
  const [dismissed, setDismissed] = useState<Set<string> | null>(null);

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  if (dismissed === null) return null;

  const visible = pending.filter((item) => !dismissed.has(item.slug));
  const hiddenCount = pending.length - visible.length;

  const draftFor = (item: CompoundSuggestion) => drafts[item.slug] ?? defaultDraft(item);
  // What 'Add all' creates: a row whose name was cleared is skipped, so the
  // button and its confirm count the same rows.
  const ready = visible.filter((item) => draftFor(item).nameEn.trim());

  const patch = (item: CompoundSuggestion, change: Partial<Draft>) =>
    setDrafts((current) => ({ ...current, [item.slug]: { ...(current[item.slug] ?? defaultDraft(item)), ...change } }));

  const dismiss = (slug: string) => {
    const next = new Set(dismissed).add(slug);
    setDismissed(next);
    writeDismissed(next);
  };

  const showHidden = () => {
    const next = new Set([...dismissed].filter((slug) => !pending.some((item) => item.slug === slug)));
    setDismissed(next);
    writeDismissed(next);
  };

  const create = (item: CompoundSuggestion) => {
    const draft = draftFor(item);
    const nameEn = draft.nameEn.trim();
    return adminFetch('/api/directory/compounds', {
      method: 'POST',
      body: {
        nameEn,
        nameAr: draft.nameAr.trim(),
        location: draft.location,
        // Every spelling staff have used, so listings under any of them resolve
        // here -- and the original listing names stay among them even when staff
        // renamed the compound, which is what stops this suggestion coming back.
        matchNames: Array.from(new Set([nameEn, ...item.variants]))
      }
    });
  };

  const createOne = async (item: CompoundSuggestion) => {
    if (!draftFor(item).nameEn.trim()) return;
    setBusy(item.slug);
    setError('');
    setRowErrors((current) => ({ ...current, [item.slug]: '' }));
    const result = await create(item);
    setBusy(null);
    if (!result.ok) {
      setRowErrors((current) => ({ ...current, [item.slug]: result.error }));
      return;
    }
    router.refresh();
  };

  const createAll = async () => {
    if (ready.length === 0) return;
    if (
      !window.confirm(
        `Add ${ready.length} ${ready.length === 1 ? 'compound' : 'compounds'} to the directory?\n\nTap "Not a compound" on any that are not real places first. One added by mistake has to be deleted from its own page.`
      )
    ) {
      return;
    }
    setBulk(true);
    setError('');
    setRowErrors({});
    let added = 0;
    const failed: Record<string, string> = {};
    for (const item of ready) {
      // Sequential on purpose: slugs are unique in the table, and firing them
      // together turns one clash into a pile of unexplained failures.
      const result = await create(item);
      if (result.ok) {
        added += 1;
        continue;
      }
      if (result.status === 401) {
        // Every request after this one would fail the same way.
        setBulk(false);
        setRowErrors(failed);
        setError(`${added > 0 ? `Added ${added}. ` : ''}${result.error}`);
        return;
      }
      failed[item.slug] = result.error;
    }
    setBulk(false);
    setRowErrors(failed);
    const failures = Object.keys(failed).length;
    if (failures > 0) {
      setError(
        `${failures} could not be added${added > 0 ? `; the other ${added} were` : ''}. The reason is on each one below.`
      );
    }
    if (added > 0) router.refresh();
  };

  if (visible.length === 0) {
    return hiddenCount > 0 ? (
      <div className="mt-8 flex flex-wrap items-center gap-x-3 text-xs text-white/35">
        <span>
          {hiddenCount} listing {hiddenCount === 1 ? 'name' : 'names'} hidden as not a compound.
        </span>
        <button
          type="button"
          onClick={showHidden}
          className="min-h-[40px] uppercase tracking-[0.16em] text-white/50 transition hover:text-[#D9B355]"
        >
          Show again
        </button>
      </div>
    ) : null;
  }

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
          disabled={bulk || busy !== null || ready.length === 0}
          className="btn-gold min-h-[44px] rounded-full px-5 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-50"
        >
          {bulk ? 'Adding...' : `Add all ${ready.length}`}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

      <div className="mt-4 space-y-2">
        {visible.map((item) => {
          const draft = draftFor(item);
          const rowError = rowErrors[item.slug];
          return (
            <div key={item.slug} className="rounded-[0.9rem] border border-white/12 bg-black/25 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">
                  {item.listingCount} {item.listingCount === 1 ? 'listing' : 'listings'}
                </span>
                <button
                  type="button"
                  onClick={() => dismiss(item.slug)}
                  disabled={bulk}
                  className="-mr-2 min-h-[40px] px-2 text-[11px] uppercase tracking-[0.16em] text-white/35 transition hover:text-white/60 disabled:opacity-40"
                >
                  Not a compound
                </button>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center">
                <input
                  value={draft.nameEn}
                  onChange={(event) => patch(item, { nameEn: event.target.value })}
                  aria-label="English name"
                  className={fieldClass}
                />
                <select
                  value={draft.location}
                  onChange={(event) => patch(item, { location: event.target.value as LocationValue })}
                  aria-label="Region"
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
                  className="min-h-[40px] rounded-full border border-[#D9B355] px-5 text-xs uppercase tracking-[0.18em] text-[#D9B355] disabled:opacity-40"
                >
                  {busy === item.slug ? 'Adding...' : 'Add'}
                </button>
              </div>

              <input
                value={draft.nameAr}
                onChange={(event) => patch(item, { nameAr: event.target.value })}
                placeholder="الاسم بالعربية (optional)"
                aria-label="Arabic name"
                dir="rtl"
                className={`mt-2 ${fieldClass}`}
              />

              {rowError ? <p className="mt-2 text-sm text-red-300">{rowError}</p> : null}

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

      {hiddenCount > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 text-xs text-white/35">
          <span>{hiddenCount} more hidden as not a compound.</span>
          <button
            type="button"
            onClick={showHidden}
            className="min-h-[40px] uppercase tracking-[0.16em] text-white/50 transition hover:text-[#D9B355]"
          >
            Show again
          </button>
        </div>
      ) : null}
    </div>
  );
}
