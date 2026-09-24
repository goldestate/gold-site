'use client';

import { useState } from 'react';
import type { Place } from '@/lib/directory-store';
import {
  PLACE_CATEGORIES,
  currentAppNote,
  tierLabel,
  type PlaceCategoryValue,
  type PlaceTierValue
} from '@/lib/directory-taxonomy';
import { adminFetch } from '@/lib/admin-fetch';
import { cleanPhone, isWhatsAppCapable, whatsappFor } from '@/lib/phone';

const fieldClass =
  'w-full rounded-[0.8rem] border border-white/12 bg-white/5 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/30 focus:border-[#D9B355]';

const labelClass = 'block space-y-1 text-[11px] uppercase tracking-[0.16em] text-white/40';

/**
 * Asked before any place goes from private to public, from the list pill or from
 * this sheet. Going public is the one change that cannot be taken back: once the
 * open endpoint has served a tradesperson's personal number, it is out there.
 * Also says when the change would take the place off the current app's screens.
 */
export function confirmMakePublic(name: string, category: PlaceCategoryValue): boolean {
  const note = currentAppNote(category, 'public');
  return window.confirm(
    `Make "${name}" public?\n\nAnyone will be able to look up this number: public places are also served without a code.${note ? `\n\n${note}` : ''}`
  );
}

/** What each tier means, in the words staff see under the Public/Private switch. */
export const TIER_HELP: Record<PlaceTierValue, string> = {
  public: 'Numbers anyone could look up, like shops and clinics. Also served without a code.',
  vetted: "GOLD's own people and this compound's contacts. Sent only to phones holding a live code, and removed when it ends."
};

/**
 * Edits one saved place in place, under its row. Everything the app can show is
 * here -- the Arabic name and notes included, which nothing else in the admin
 * collects -- so fixing a digit no longer means deleting the place and typing it
 * in again under every compound it was copied to.
 */
export function PlaceEditSheet({
  place,
  blocked,
  onBusyChange,
  onClose,
  onSaved
}: {
  place: Place;
  /** Another write in the editor is running; one at a time, as everywhere else there. */
  blocked: boolean;
  /**
   * Tells the editor a save is running, so it can hold every other control --
   * including the rows, since opening another one would unmount this sheet
   * mid-save and lose whatever the save says.
   */
  onBusyChange: (saving: boolean) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nameEn, setNameEn] = useState(place.nameEn);
  const [nameAr, setNameAr] = useState(place.nameAr);
  const [phone, setPhone] = useState(place.phone ?? '');
  // A stored WhatsApp that cannot be one (a landline copied in by the old admin)
  // starts cleared, so saving the sheet also fixes the row.
  const [whatsapp, setWhatsapp] = useState(whatsappFor(place.whatsapp) ?? '');
  const [category, setCategory] = useState<PlaceCategoryValue>(place.category);
  const [tier, setTier] = useState<PlaceTierValue>(place.tier);
  const [address, setAddress] = useState(place.address ?? '');
  const [notesEn, setNotesEn] = useState(place.notesEn);
  const [notesAr, setNotesAr] = useState(place.notesAr);
  const [hidden, setHidden] = useState(!place.active);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const droppedWhatsapp = place.whatsapp && !isWhatsAppCapable(place.whatsapp) ? place.whatsapp : null;
  const phoneAsWhatsapp = whatsappFor(phone);
  const whatsappInvalid = whatsapp.trim().length > 0 && !isWhatsAppCapable(whatsapp);
  const appNote = currentAppNote(category, tier);
  // The saved number, so staff can still ring it from the admin: the row itself opens this sheet.
  const savedPhone = place.phone ? cleanPhone(place.phone) : '';

  const save = async () => {
    if (!nameEn.trim()) {
      setError('The English name is required.');
      return;
    }
    if (place.tier === 'vetted' && tier === 'public' && !confirmMakePublic(nameEn.trim(), category)) return;
    setBusy(true);
    onBusyChange(true);
    setError('');
    const result = await adminFetch(`/api/directory/places/${place.id}`, {
      method: 'PATCH',
      body: {
        nameEn: nameEn.trim(),
        nameAr: nameAr.trim(),
        phone: phone.trim() ? cleanPhone(phone) : null,
        whatsapp: whatsappFor(whatsapp),
        category,
        tier,
        address: address.trim() || null,
        notesEn: notesEn.trim(),
        notesAr: notesAr.trim(),
        active: !hidden
      }
    });
    setBusy(false);
    onBusyChange(false);
    if (result.ok === false && result.status === 404) {
      // Deleted in another tab: nothing left to save into, and the refresh takes
      // the row off the list rather than leaving a sheet for a place that is gone.
      onSaved();
      return;
    }
    if (!result.ok) {
      // Kept open with everything typed: on a 401 the fix is logging in again in
      // another tab and tapping Save here, not starting over.
      setError(result.error);
      return;
    }
    onSaved();
  };

  return (
    <div className="space-y-3">
      <label className={labelClass}>
        <span>English name</span>
        <input value={nameEn} onChange={(event) => setNameEn(event.target.value)} className={`${fieldClass} normal-case tracking-normal`} />
      </label>
      <label className={labelClass}>
        <span>Arabic name</span>
        <input
          value={nameAr}
          onChange={(event) => setNameAr(event.target.value)}
          dir="rtl"
          lang="ar"
          placeholder="Shown to guests using the app in Arabic"
          className={`${fieldClass} normal-case tracking-normal`}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>
            <span>Phone</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              className={`${fieldClass} font-mono tracking-normal`}
            />
          </label>
          {savedPhone ? (
            <a
              href={`tel:${savedPhone}`}
              className="inline-flex min-h-[40px] items-center text-[11px] uppercase tracking-[0.14em] text-[#D9B355]"
            >
              Call <span className="ml-1.5 font-mono normal-case tracking-normal">{place.phone}</span>
            </a>
          ) : null}
        </div>
        <div className="space-y-1">
          <label className={labelClass}>
            <span>WhatsApp</span>
            <input
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              inputMode="tel"
              placeholder="None"
              className={`${fieldClass} font-mono tracking-normal`}
            />
          </label>
          {whatsappInvalid ? (
            <p className="text-[11px] text-[#E8C27A]">Not a mobile number, so it will be saved without WhatsApp.</p>
          ) : !whatsapp.trim() && phoneAsWhatsapp ? (
            <button
              type="button"
              onClick={() => setWhatsapp(phoneAsWhatsapp)}
              className="min-h-[40px] text-[11px] uppercase tracking-[0.14em] text-[#D9B355]"
            >
              Same as phone
            </button>
          ) : null}
          {droppedWhatsapp && !whatsapp.trim() ? (
            <p className="text-[11px] text-white/40">
              The saved WhatsApp {droppedWhatsapp} is not a mobile number and will be removed.
            </p>
          ) : null}
        </div>
      </div>

      <label className={labelClass}>
        <span>Category</span>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as PlaceCategoryValue)}
          className={`${fieldClass} normal-case tracking-normal`}
        >
          {PLACE_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value} className="bg-[#231F20]">
              {item.en}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-1.5">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Who can get this number">
          {(['public', 'vetted'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={tier === value}
              onClick={() => setTier(value)}
              className={`min-h-[44px] rounded-full border text-xs uppercase tracking-[0.16em] transition ${
                tier === value ? 'border-[#D9B355] bg-[rgba(217,179,85,0.12)] text-[#D9B355]' : 'border-white/15 text-white/50'
              }`}
            >
              {tierLabel(value)}
            </button>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-white/45">{TIER_HELP[tier]}</p>
        {appNote ? <p className="text-[11px] leading-relaxed text-[#E8C27A]">{appNote}</p> : null}
      </div>

      <label className={labelClass}>
        <span>Address</span>
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Optional"
          className={`${fieldClass} normal-case tracking-normal`}
        />
      </label>
      <label className={labelClass}>
        <span>Notes (English)</span>
        <textarea
          value={notesEn}
          onChange={(event) => setNotesEn(event.target.value)}
          rows={2}
          placeholder="e.g. Open 24 hours, delivers to the compound"
          className={`${fieldClass} normal-case tracking-normal`}
        />
      </label>
      <label className={labelClass}>
        <span>Notes (Arabic)</span>
        <textarea
          value={notesAr}
          onChange={(event) => setNotesAr(event.target.value)}
          rows={2}
          dir="rtl"
          lang="ar"
          className={`${fieldClass} normal-case tracking-normal`}
        />
      </label>

      <button
        type="button"
        role="switch"
        aria-checked={hidden}
        onClick={() => setHidden((value) => !value)}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[0.8rem] border border-white/12 px-3 py-2 text-left"
      >
        <span>
          <span className="block text-sm text-white">Hidden</span>
          <span className="block text-[11px] text-white/40">Kept here, but sent to no phone.</span>
        </span>
        <span
          className={`relative h-6 w-11 flex-none rounded-full transition ${hidden ? 'bg-[#D9B355]' : 'bg-white/15'}`}
          aria-hidden="true"
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${hidden ? 'left-[1.375rem]' : 'left-0.5'}`}
          />
        </span>
      </button>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={busy || blocked || !nameEn.trim()}
          className="btn-gold flex-1 rounded-full py-3 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-40"
        >
          {busy ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-full border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.18em] text-white/60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
