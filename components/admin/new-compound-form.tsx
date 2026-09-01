'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
    setBusy(true);
    setError('');
    const res = await fetch('/api/directory/compounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameEn: nameEn.trim(), nameAr: nameAr.trim(), location })
    });
    setBusy(false);
    if (!res.ok) {
      setError('Could not add this compound.');
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
        placeholder="Compound name (e.g. Hacienda Bay)"
        className={fieldClass}
      />
      <input
        value={nameAr}
        onChange={(event) => setNameAr(event.target.value)}
        placeholder="الاسم بالعربية (optional)"
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
          onClick={() => setOpen(false)}
          className="rounded-full border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.18em] text-white/60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
