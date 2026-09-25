'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Compound } from '@/lib/directory-store';
import { adminFetch } from '@/lib/admin-fetch';
import { LOCATIONS, type LocationValue } from '@/lib/property-taxonomy';

const fieldClass =
  'w-full rounded-[0.8rem] border border-white/12 bg-white/5 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/30 focus:border-[#D9B355]';

/**
 * Everything about the compound itself, as opposed to its list: its names, its
 * region, whether the app shows it, and deleting it.
 *
 * Before this a typo in a name, a wrong region or a junk compound from 'Add
 * all' could only be fixed in the SQL editor. Hiding comes before deleting on
 * purpose: it is reversible, and it is usually what "remove this" means.
 *
 * The web address (slug) is not editable. Phones that unlocked the compound
 * know it by slug, so a rename changes what people read and nothing else.
 */
export function CompoundSettings({
  compound,
  placeCount,
  codeCount
}: {
  compound: Compound;
  placeCount: number;
  codeCount: number;
}) {
  const router = useRouter();
  // A compound added without an Arabic name stores the English one there (the
  // column is required). Showing it in the Arabic box would read as a mistake.
  const savedAr = compound.nameAr === compound.nameEn ? '' : compound.nameAr;

  const [nameEn, setNameEn] = useState(compound.nameEn);
  const [nameAr, setNameAr] = useState(savedAr);
  const [location, setLocation] = useState<LocationValue>(compound.location);
  const [busy, setBusy] = useState<'save' | 'active' | 'delete' | null>(null);
  const [error, setError] = useState<{ scope: 'save' | 'active' | 'delete'; text: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmName, setConfirmName] = useState('');

  const dirty =
    nameEn.trim() !== compound.nameEn || nameAr.trim() !== savedAr || location !== compound.location;
  const confirmed = confirmName.trim().toLowerCase() === compound.nameEn.trim().toLowerCase();

  const errorFor = (scope: 'save' | 'active' | 'delete') =>
    error?.scope === scope ? <p className="mt-2 text-sm text-red-300">{error.text}</p> : null;

  const save = async () => {
    if (!nameEn.trim()) {
      setError({ scope: 'save', text: 'Give the compound an English name.' });
      return;
    }
    setBusy('save');
    setError(null);
    const result = await adminFetch('/api/directory/compounds', {
      method: 'PATCH',
      // An empty Arabic box is sent as empty; the server stores the English
      // name in its place, as it does when a compound is first added.
      body: { id: compound.id, nameEn: nameEn.trim(), nameAr: nameAr.trim(), location }
    });
    setBusy(null);
    if (!result.ok) {
      setError({ scope: 'save', text: result.error });
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  };

  const toggleActive = async () => {
    const hiding = compound.active;
    if (
      hiding &&
      !window.confirm(
        `Hide ${compound.nameEn} from the app?\n\nIts codes stop unlocking, and phones that already unlocked it lose it the next time they are online. Nothing is deleted: show it again at any time and every code that has not ended works again.`
      )
    ) {
      return;
    }
    setBusy('active');
    setError(null);
    const result = await adminFetch('/api/directory/compounds', {
      method: 'PATCH',
      body: { id: compound.id, active: !hiding }
    });
    setBusy(null);
    if (!result.ok) {
      setError({ scope: 'active', text: result.error });
      return;
    }
    router.refresh();
  };

  const remove = async () => {
    if (!confirmed) return;
    setBusy('delete');
    setError(null);
    const result = await adminFetch('/api/directory/compounds', {
      method: 'DELETE',
      body: { id: compound.id }
    });
    if (!result.ok) {
      setBusy(null);
      setError({ scope: 'delete', text: result.error });
      return;
    }
    // A full navigation, replacing this page: the router's cache still holds
    // the list with this compound in it, and Back would land on a 404.
    window.location.replace('/goldenadmin2026/directory');
  };

  return (
    <div className="rounded-[1rem] border border-white/12 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-white/40">Compound</div>

      <div className="mt-3 space-y-2">
        <input
          value={nameEn}
          onChange={(event) => {
            setNameEn(event.target.value);
            setSaved(false);
          }}
          placeholder="Name in English"
          aria-label="English name"
          className={fieldClass}
        />
        <input
          value={nameAr}
          onChange={(event) => {
            setNameAr(event.target.value);
            setSaved(false);
          }}
          placeholder="الاسم بالعربية"
          aria-label="Arabic name"
          dir="rtl"
          className={fieldClass}
        />
        <select
          value={location}
          onChange={(event) => {
            setLocation(event.target.value as LocationValue);
            setSaved(false);
          }}
          aria-label="Region"
          className={fieldClass}
        >
          {LOCATIONS.map((item) => (
            <option key={item.value} value={item.value} className="bg-[#231F20]">
              {item.en}
            </option>
          ))}
        </select>
      </div>
      {savedAr ? null : (
        <p className="mt-1.5 text-[11px] text-white/35">
          No Arabic name yet, so Arabic readers see the English one.
        </p>
      )}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy !== null || !dirty}
          className="min-h-[44px] rounded-full border border-white/20 px-5 text-xs uppercase tracking-[0.18em] text-white disabled:opacity-40"
        >
          {busy === 'save' ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
        </button>
      </div>
      {errorFor('save')}

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={`text-sm ${compound.active ? 'text-[#8FAE78]' : 'text-[#D9A441]'}`}>
            {compound.active ? 'Live in the app' : 'Hidden from the app'}
          </span>
          <button
            type="button"
            onClick={toggleActive}
            disabled={busy !== null}
            className="min-h-[44px] rounded-full border border-white/20 px-5 text-xs uppercase tracking-[0.18em] text-white disabled:opacity-40"
          >
            {busy === 'active' ? 'Saving...' : compound.active ? 'Hide' : 'Show again'}
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-white/40">
          {compound.active
            ? 'Hiding takes the compound out of the app and stops its codes unlocking. Phones that already unlocked it lose it the next time they are online. Nothing is deleted.'
            : 'Hidden: guests cannot see it and its codes do not unlock. Show it again and every code that has not ended works again.'}
        </p>
        {errorFor('active')}
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        {deleting ? (
          <div className="rounded-[0.9rem] border border-red-400/30 bg-red-500/5 p-3">
            <p className="text-sm leading-relaxed text-white/70">
              This deletes <strong className="text-white">{compound.nameEn}</strong>, its {placeCount}{' '}
              {placeCount === 1 ? 'entry' : 'entries'} and all {codeCount} guest{' '}
              {codeCount === 1 ? 'code' : 'codes'}. Guests who unlocked it lose it the next time their
              phone is online. It cannot be undone &mdash; to take it out of the app for now, hide it
              instead.
            </p>
            <label className="mt-3 block text-[11px] uppercase tracking-[0.16em] text-white/45" htmlFor="confirm-delete">
              Type {compound.nameEn} to confirm
            </label>
            <input
              id="confirm-delete"
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className={`mt-2 ${fieldClass}`}
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={remove}
                disabled={!confirmed || busy !== null}
                className="min-h-[44px] flex-1 rounded-full border border-red-400/60 bg-red-500/10 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-red-200 disabled:opacity-40"
              >
                {busy === 'delete' ? 'Deleting...' : 'Delete for good'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleting(false);
                  setConfirmName('');
                  setError(null);
                }}
                disabled={busy === 'delete'}
                className="min-h-[44px] rounded-full border border-white/15 px-5 text-xs uppercase tracking-[0.18em] text-white/60"
              >
                Cancel
              </button>
            </div>
            {errorFor('delete')}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDeleting(true)}
            disabled={busy !== null}
            className="min-h-[44px] rounded-full border border-red-400/40 px-5 text-xs uppercase tracking-[0.18em] text-red-300 disabled:opacity-40"
          >
            Delete compound...
          </button>
        )}
      </div>
    </div>
  );
}
