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
 * How far around the compound its guide opens by itself.
 *
 * Staff don't place compounds on the map: the site finds each one on
 * OpenStreetMap by name (lib/compound-pins.ts), and the app finds the rest on
 * Apple Maps. What is left to decide is the distance, so that is the control
 * here, and it saves as soon as it is tapped.
 *
 * "Wrong place?" is for the rare miss -- a compound neither map knows, or one
 * found somewhere it isn't. A spot placed there is kept over anything automatic.
 */
export function CompoundPin({ compound, neighbours }: { compound: Compound; neighbours: Neighbour[] }) {
  const router = useRouter();
  const [radius, setRadius] = useState(compound.radiusKm);
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<Pin | null>(null);
  const [busy, setBusy] = useState<'radius' | 'save' | 'lookup' | 'locate' | 'link' | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  // The page refreshes after every save; follow what the server now says.
  useEffect(() => setRadius(compound.radiusKm), [compound.radiusKm]);

  const saveRadius = async (km: number) => {
    const before = radius;
    setRadius(km);
    setBusy('radius');
    setError('');
    setNote('');
    const result = await adminFetch('/api/directory/compounds', {
      method: 'PATCH',
      body: { id: compound.id, radiusKm: km }
    });
    setBusy(null);
    if (!result.ok) {
      setRadius(before);
      setError(result.error);
      return;
    }
    setNote(`Saved: ${km} km.`);
    router.refresh();
  };

  const lookUpAgain = async () => {
    setBusy('lookup');
    setError('');
    setNote('');
    const result = await adminFetch<{ found: boolean }>('/api/directory/compounds', {
      method: 'PATCH',
      body: { id: compound.id, findOnMap: true }
    });
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNote(
      result.data.found
        ? 'Found it on the map. Check it on Google Maps.'
        : `OpenStreetMap doesn't know ${compound.nameEn} under that name. Guests' phones still try Apple Maps, or place it yourself below.`
    );
    router.refresh();
  };

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
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text]);

  const onText = (value: string) => {
    setText(value);
    setNote('');
    const parsed = parsePin(value);
    if (parsed) {
      setDraft(parsed);
      setError('');
    } else if (value.trim() && !isShortMapLink(value.trim())) {
      setDraft(null);
      setError("Couldn't read a location from that. Paste a Google Maps link, or coordinates like 30.98712, 28.76543.");
    } else {
      setDraft(null);
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
        const accuracy = Math.round(position.coords.accuracy);
        if (accuracy > 300) setNote(`Only accurate to about ${accuracy} m. Step outside and try again.`);
      },
      (failure) => {
        setBusy(null);
        setError(
          failure.code === failure.PERMISSION_DENIED
            ? 'The browser was not allowed to use your location. Allow it in the browser settings, or paste a link instead.'
            : 'Could not get your location. Try again outside, or paste a link instead.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const saveSpot = async () => {
    if (!draft) return;
    setBusy('save');
    setError('');
    const result = await adminFetch('/api/directory/compounds', {
      method: 'PATCH',
      body: { id: compound.id, pin: draft }
    });
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setText('');
    setDraft(null);
    setNote('Saved. This spot is kept over anything found automatically.');
    router.refresh();
  };

  // Another compound whose circle touches this one. Not an error -- a guest in
  // the overlap is shown the nearer one -- but a smaller distance may be better.
  const overlaps = compound.pin
    ? neighbours
        .map((item) => ({ ...item, apart: distanceKm(compound.pin as Pin, item.pin) }))
        .filter((item) => item.apart < radius + item.radiusKm)
        .sort((a, b) => a.apart - b.apart)
    : [];

  const mapLink = (pin: Pin) => (
    <a
      href={googleMapsUrl(pin)}
      target="_blank"
      rel="noreferrer"
      className="text-[#D9B355] underline-offset-2 hover:underline"
    >
      Check on Google Maps
    </a>
  );

  return (
    <div id="pin" className="rounded-[1rem] border border-white/12 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-white/40">Opens by location</div>

      <div className="mt-3 text-[11px] uppercase tracking-[0.16em] text-white/45">
        Guests within this distance see {compound.nameEn} without a code
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {RADIUS_CHOICES_KM.map((km) => (
          <button
            key={km}
            type="button"
            onClick={() => km !== radius && saveRadius(km)}
            disabled={busy !== null}
            aria-pressed={radius === km}
            className={`min-h-[44px] min-w-[64px] rounded-full border px-3 text-sm transition disabled:opacity-60 ${
              radius === km
                ? 'border-[#D9B355] bg-[rgba(217,179,85,0.14)] text-[#D9B355]'
                : 'border-white/15 text-white/60'
            }`}
          >
            {km} km
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-white/60">
        {compound.pin ? (
          <>
            {compound.pinSource === 'staff' ? 'Placed by hand.' : 'Found on the map automatically.'}{' '}
            {mapLink(compound.pin)}
          </>
        ) : (
          <span className="text-[#D9A441]">
            Not on OpenStreetMap yet. Guests&apos; phones also look it up on Apple Maps, so it usually still opens
            by location.
          </span>
        )}
      </p>

      {overlaps.length > 0 ? (
        <p className="mt-2 text-[12px] leading-relaxed text-[#D9A441]">
          Overlaps {overlaps.map((item) => `${item.nameEn} (${item.apart.toFixed(1)} km apart)`).join(', ')}. A guest
          in between sees whichever is nearer. Pick a smaller distance if that would be wrong.
        </p>
      ) : null}

      {note ? <p className="mt-2 text-xs text-white/50">{note}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}

      <details className="mt-4 border-t border-white/10 pt-3">
        <summary className="flex min-h-[40px] cursor-pointer items-center text-xs uppercase tracking-[0.16em] text-white/50">
          Wrong place? Fix it
        </summary>
        <div className="mt-2 space-y-2">
          <button
            type="button"
            onClick={lookUpAgain}
            disabled={busy !== null}
            className="min-h-[44px] w-full rounded-full border border-white/20 px-5 text-xs uppercase tracking-[0.18em] text-white disabled:opacity-40"
          >
            {busy === 'lookup' ? 'Looking it up...' : 'Look it up on the map again'}
          </button>
          <p className="pt-1 text-[11px] leading-relaxed text-white/40">
            Or place it yourself: paste a Google Maps link or coordinates, or stand in the compound and use your
            phone&apos;s location. A spot placed here is never moved automatically.
          </p>
          <input
            value={text}
            onChange={(event) => onText(event.target.value)}
            placeholder="Google Maps link or coordinates"
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
          {busy === 'link' ? <p className="text-xs text-white/50">Reading the link...</p> : null}
          {draft ? (
            <div className="rounded-[0.9rem] border border-[rgba(217,179,85,0.35)] bg-[rgba(217,179,85,0.06)] p-3 text-sm">
              <div className="text-white/80">
                <span className="font-mono text-white">{formatPin(draft)}</span> {mapLink(draft)}
              </div>
              {isInEgypt(draft) ? null : (
                <p className="mt-1.5 text-[#D9A441]">
                  That is outside Egypt. Check the two numbers aren&apos;t swapped: on the North Coast the first is
                  about 31 and the second about 27 to 29.
                </p>
              )}
              <button
                type="button"
                onClick={saveSpot}
                disabled={busy !== null}
                className="btn-gold mt-3 min-h-[44px] w-full rounded-full px-6 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-40"
              >
                {busy === 'save' ? 'Saving...' : 'Save this spot'}
              </button>
            </div>
          ) : null}
        </div>
      </details>

      <p className="mt-3 text-[10px] text-white/30">Map data © OpenStreetMap contributors</p>
    </div>
  );
}
