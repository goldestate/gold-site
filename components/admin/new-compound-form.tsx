'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { adminFetch } from '@/lib/admin-fetch';
import { slugifyCompound } from '@/lib/directory-taxonomy';
import { LOCATIONS, type LocationValue } from '@/lib/property-taxonomy';

const fieldClass =
  'w-full rounded-[0.9rem] border border-white/12 bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/30 focus:border-[#D9B355]';

export function NewCompoundForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [location, setLocation] = useState<LocationValue>(LOCATIONS[0].value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!nameEn.trim()) {
      setError('Enter the compound name.');
      return;
    }
    // The web address is built from Latin letters and digits, so a name typed
    // in Arabic here has none. The server refuses it too; saying so before the
    // round trip saves a wait on a weak signal.
    if (!slugifyCompound(nameEn)) {
      setError('Give the compound an English name. The Arabic name goes in the second box.');
      return;
    }
    setBusy(true);
    setError('');
    const result = await adminFetch('/api/directory/compounds', {
      method: 'POST',
      body: { nameEn: nameEn.trim(), nameAr: nameAr.trim(), location }
    });
    setBusy(false);
    if (!result.ok) {
      // The server's own reason: already in the directory, no English name, or
      // the login expired (in which case nothing is refreshed, so the typing stays).
      setError(result.error);
      return;
    }
    setNameEn('');
    setNameAr('');
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 w-full rounded-[1rem] border border-dashed border-white/20 py-4 text-sm uppercase tracking-[0.16em] text-white/60 transition active:scale-[0.99] hover:border-[#D9B355] hover:text-[#D9B355]"
      >
        + Add compound
      </button>
    );
  }

  return (
    <div className="mt-5 space-y-3 rounded-[1rem] border border-white/12 bg-white/5 p-4">
      <input
        value={nameEn}
        onChange={(event) => setNameEn(event.target.value)}
        placeholder="Compound name in English (e.g. Hacienda Bay)"
        aria-label="English name"
        className={fieldClass}
      />
      <input
        value={nameAr}
        onChange={(event) => setNameAr(event.target.value)}
        placeholder="الاسم بالعربية (optional)"
        aria-label="Arabic name"
        dir="rtl"
        className={fieldClass}
      />
      <select
        value={location}
        onChange={(event) => setLocation(event.target.value as LocationValue)}
        className={fieldClass}
      >
        {LOCATIONS.map((item) => (
          <option key={item.value} value={item.value} className="bg-[#231F20]">
            {item.en}
          </option>
        ))}
      </select>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="btn-gold flex-1 rounded-full py-3 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-50"
        >
          {busy ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError('');
          }}
          className="rounded-full border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.18em] text-white/60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
