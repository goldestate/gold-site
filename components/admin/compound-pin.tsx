'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Compound } from '@/lib/directory-store';
import { adminFetch } from '@/lib/admin-fetch';
import {
  RADIUS_CHOICES_KM,
  distanceKm,
  formatPin,
  googleMapsUrl,
  isInEgypt,
  isShortMapLink,
  parsePin,
  type Pin
} from '@/lib/map-pin';

const fieldClass =
  'w-full rounded-[0.8rem] border border-white/12 bg-white/5 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/30 focus:border-[#D9B355]';

type Neighbour = { nameEn: string; pin: Pin; radiusKm: number };

/**
 * Where the compound is on the map.
 *
 * This is what lets the app show a guest the compound's public places without a
 * code: the phone compares its own location with every compound's pin and
 * radius, on the phone, and opens the guide of the one it is inside. A compound
 * without a pin can still be opened with a code, but never by location.
 *
 * Staff usually set this from Cairo, not standing in the compound, so a pasted
 * Google Maps link or coordinates is the main path, and "where I am now" the
 * shortcut for when they are there.
 */
export function CompoundPin({ compound, neighbours }: { compound: Compound; neighbours: Neighbour[] }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<Pin | null>(compound.pin);
  const [radius, setRadius] = useState(compound.radiusKm);
  const [busy, setBusy] = useState<'save' | 'remove' | 'locate' | 'link' | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const dirty =
    radius !== compound.radiusKm ||
    (draft?.lat ?? null) !== (compound.pin?.lat ?? null) ||
    (draft?.lng ?? null) !== (compound.pin?.lng ?? null);

  // A share link from the Google Maps app has no coordinates in it; the server
  // expands it. Waits for typing to stop, so a link typed by hand is not sent
  // half-finished on every keystroke.
  useEffect(() => {
    const value = text.trim();
    if (!isShortMapLink(value) || parsePin(value)) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setBusy('link');
      const result = await adminFetch<{ pin: Pin }>('/api/directory/map-link', {
        method: 'POST',
        body: { url: value }
      });
      // Cleared even when superseded, or the buttons stay locked on a link
      // staff already replaced.
      setBusy((current) => (current === 'link' ? null : current));
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft(result.data.pin);
      setError('');
      setNote('Read from the link. Check it on Google Maps before saving.');
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text]);

  const onText = (value: string) => {
    setText(value);
    setSaved(false);
    setNote('');
    const parsed = parsePin(value);
    if (parsed) {
      setDraft(parsed);
      setError('');
    } else if (value.trim() && !isShortMapLink(value.trim())) {
      setError("Couldn't read a location from that. Paste a Google Maps link, or coordinates like 30.98712, 28.76543.");
    } else {
      setError('');
    }
  };

  const useHere = () => {
    if (!('geolocation' in navigator)) {
      setError('This browser cannot share its location.');
      return;
    }
    setBusy('locate');
    setError('');
    setNote('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBusy(null);
        const here = { lat: position.coords.latitude, lng: position.coords.longitude };
        setDraft(here);
        setText(formatPin(here));
        setSaved(false);
        const accuracy = Math.round(position.coords.accuracy);
        setNote(
          accuracy > 300
            ? `Only accurate to about ${accuracy} m. Step outside, or paste the pin from Google Maps instead.`
            : `Accurate to about ${accuracy} m.`
        );
      },
      (failure) => {
        setBusy(null);
        setError(
          failure.code === failure.PERMISSION_DENIED
            ? 'The browser was not allowed to use your location. Allow it in the browser settings, or paste the pin instead.'
            : 'Could not get your location. Try again outside, or paste the pin instead.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const save = async (pin: Pin | null) => {
    setBusy(pin ? 'save' : 'remove');
    setError('');
    const result = await adminFetch('/api/directory/compounds', {
      method: 'PATCH',
      body: pin ? { id: compound.id, pin, radiusKm: radius } : { id: compound.id, pin: null }
    });
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (!pin) setDraft(null);
    setText('');
    setNote('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  };

  const remove = () => {
    if (
      window.confirm(
        `Remove ${compound.nameEn}'s pin?\n\nGuests will no longer find it from their location. Codes keep working.`
      )
    ) {
      save(null);
    }
  };

  // Another compound whose circle touches this one. Not an error -- a guest in
  // the overlap is shown the nearer pin -- but worth knowing before saving.
  const overlaps = draft
    ? neighbours
        .map((item) => ({ ...item, apart: distanceKm(draft, item.pin) }))
        .filter((item) => item.apart < radius + item.radiusKm)
        .sort((a, b) => a.apart - b.apart)
    : [];

  return (
    <div id="pin" className="rounded-[1rem] border border-white/12 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-white/40">Where is it?</div>

      {compound.pin ? (
        <p className="mt-2 text-sm text-white/70">
          Pinned at <span className="font-mono text-white">{formatPin(compound.pin)}</span>, within{' '}
          {compound.radiusKm} km.{' '}
          <a
            href={googleMapsUrl(compound.pin)}
            target="_blank"
            rel="noreferrer"
            className="text-[#D9B355] underline-offset-2 hover:underline"
          >
            Check on Google Maps
          </a>
        </p>
      ) : (
        <p className="mt-2 text-sm text-[#D9A441]">
          No pin yet. Guests can only open {compound.nameEn} with a code until it has one.
        </p>
      )}

      <div className="mt-3 space-y-2">
        <input
          value={text}
          onChange={(event) => onText(event.target.value)}
          placeholder="Paste a Google Maps link or coordinates"
          aria-label="Google Maps link or coordinates"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className={fieldClass}
        />
        <button
          type="button"
          onClick={useHere}
          disabled={busy !== null}
          className="min-h-[44px] w-full rounded-full border border-white/20 px-5 text-xs uppercase tracking-[0.18em] text-white disabled:opacity-40"
        >
          {busy === 'locate' ? 'Finding you...' : "Use where I'm standing"}
        </button>
      </div>

      {busy === 'link' ? <p className="mt-2 text-xs text-white/50">Reading the link...</p> : null}
      {note ? <p className="mt-2 text-xs text-white/50">{note}</p> : null}

      {draft && dirty ? (
        <div className="mt-3 rounded-[0.9rem] border border-[rgba(217,179,85,0.35)] bg-[rgba(217,179,85,0.06)] p-3 text-sm">
          <div className="text-white/80">
            New pin <span className="font-mono text-white">{formatPin(draft)}</span>{' '}
            <a
              href={googleMapsUrl(draft)}
              target="_blank"
              rel="noreferrer"
              className="text-[#D9B355] underline-offset-2 hover:underline"
            >
              Check on Google Maps
            </a>
          </div>
          {isInEgypt(draft) ? null : (
            <p className="mt-1.5 text-[#D9A441]">
              That is outside Egypt. Check the two numbers aren&apos;t swapped: on the North Coast the first is about
              31 and the second about 27 to 29.
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">Counts as {compound.nameEn} within</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {RADIUS_CHOICES_KM.map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => {
                setRadius(km);
                setSaved(false);
              }}
              aria-pressed={radius === km}
              className={`min-h-[40px] min-w-[56px] rounded-full border px-3 text-sm transition ${
                radius === km
                  ? 'border-[#D9B355] bg-[rgba(217,179,85,0.14)] text-[#D9B355]'
                  : 'border-white/15 text-white/60'
              }`}
            >
              {km} km
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-white/40">
          A guest within {radius} km of the pin sees {compound.nameEn}&apos;s public places without a code. Their
          location stays on their phone; the app compares it with the pins itself.
        </p>
      </div>

      {overlaps.length > 0 ? (
        <p className="mt-3 text-[12px] leading-relaxed text-[#D9A441]">
          Overlaps {overlaps.map((item) => `${item.nameEn} (${item.apart.toFixed(1)} km apart)`).join(', ')}. A guest
          in between sees whichever pin is nearer. Pick a smaller distance if that would be wrong.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => draft && save(draft)}
          disabled={busy !== null || !draft || !dirty}
          className="btn-gold min-h-[44px] rounded-full px-6 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-40"
        >
          {busy === 'save' ? 'Saving...' : saved ? 'Saved' : 'Save pin'}
        </button>
        {compound.pin ? (
          <button
            type="button"
            onClick={remove}
            disabled={busy !== null}
            className="min-h-[44px] rounded-full border border-white/15 px-5 text-xs uppercase tracking-[0.18em] text-white/60 disabled:opacity-40"
          >
            {busy === 'remove' ? 'Removing...' : 'Remove pin'}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
