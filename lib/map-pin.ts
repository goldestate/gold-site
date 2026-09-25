/**
 * Compound pins: reading one out of whatever staff paste, and measuring between
 * two. Imported by the admin (client) and the API (server), so it imports nothing.
 */

import type { LocationValue } from './property-taxonomy';

export type Pin = { lat: number; lng: number };

/** [west, south, east, north], in degrees. */
export type Box = [number, number, number, number];

/**
 * Where each region is, generously. A compound looked up by name must land
 * inside its own region's box: "Mountain View" alone finds the one in New Cairo,
 * and the box is what keeps the North Coast compound from being pinned there.
 *
 * The app keeps the same boxes (Location.box, CompoundPinFinder.swift) for the
 * compounds it looks up on Apple Maps. Change both together.
 */
export const REGION_BOXES: Record<LocationValue, Box> = {
  // Agami to past Marsa Matrouh.
  'north-coast': [26.8, 30.6, 30.0, 31.6],
  'sheikh-zayed': [30.85, 29.9, 31.1, 30.15],
  'new-cairo': [31.3, 29.9, 31.8, 30.15],
  // Ain Sokhna and the Galala plateau above it.
  'ain-sokhna': [32.1, 29.1, 32.9, 29.95],
  // El Gouna and Hurghada.
  gouna: [33.4, 26.9, 34.0, 27.6]
};

export function isInBox(pin: Pin, box: Box): boolean {
  const [west, south, east, north] = box;
  return pin.lng >= west && pin.lng <= east && pin.lat >= south && pin.lat <= north;
}

/** The radius staff get unless they change it, in km. Matches the column default in 006. */
export const DEFAULT_RADIUS_KM = 3;
export const RADIUS_CHOICES_KM = [1, 2, 3, 5, 8] as const;

/**
 * Egypt with a margin. Not a validity rule -- the database accepts any
 * coordinates -- but a pin outside it is almost always a typo, and usually
 * latitude and longitude swapped, which the admin says out loud.
 */
export function isInEgypt(pin: Pin): boolean {
  return pin.lat >= 21.5 && pin.lat <= 31.9 && pin.lng >= 24.5 && pin.lng <= 37.2;
}

export function isValidPin(pin: Pin): boolean {
  return (
    Number.isFinite(pin.lat) &&
    Number.isFinite(pin.lng) &&
    Math.abs(pin.lat) <= 90 &&
    Math.abs(pin.lng) <= 180 &&
    // 0,0 is in the Atlantic and is what a blank field parses as.
    !(pin.lat === 0 && pin.lng === 0)
  );
}

/** Great-circle distance in km. */
export function distanceKm(a: Pin, b: Pin): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function googleMapsUrl(pin: Pin): string {
  return `https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`;
}

/** Five decimals is about a metre: more reads as precision nobody has. */
export function formatPin(pin: Pin): string {
  return `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`;
}

function pin(lat: number, lng: number): Pin | null {
  const candidate = { lat, lng };
  return isValidPin(candidate) ? candidate : null;
}

/** 30°59'15.4"N 28°45'55.4"E -- what Google Maps shows for a dropped pin. */
function fromDms(text: string): Pin | null {
  const part = /(\d{1,3})\s*°\s*(\d{1,2})\s*['′]\s*(\d{1,2}(?:\.\d+)?)\s*(?:["″]|'')?\s*([NSEW])/gi;
  const found = [...text.matchAll(part)];
  if (found.length < 2) return null;
  const value = (match: RegExpMatchArray) => {
    const decimal = Number(match[1]) + Number(match[2]) / 60 + Number(match[3]) / 3600;
    return /[SW]/i.test(match[4]) ? -decimal : decimal;
  };
  const latMatch = found.find((item) => /[NS]/i.test(item[4]));
  const lngMatch = found.find((item) => /[EW]/i.test(item[4]));
  if (!latMatch || !lngMatch) return null;
  return pin(value(latMatch), value(lngMatch));
}

/**
 * Reads a pin out of what staff paste. Accepts:
 *   30.98712, 28.76543            -- copied from a dropped pin
 *   30°59'15.4"N 28°45'55.4"E     -- the same pin, as Google Maps prints it
 *   https://www.google.com/maps/place/.../@30.98,28.76,15z/data=...!3d30.987!4d28.765
 *   https://maps.google.com/?q=30.98,28.76, .../search/?api=1&query=..., geo:30.98,28.76
 *   https://maps.apple.com/?ll=30.98,28.76
 *
 * In a Google place link, `!3d…!4d…` is the place itself and `@…` is only where
 * the map happened to be centred, so the first wins when both are there.
 *
 * Short links (maps.app.goo.gl) carry no coordinates; the admin sends those to
 * /api/directory/map-link to be expanded first. Returns null when nothing in
 * the text is a usable pin.
 */
export function parsePin(raw: string): Pin | null {
  const text = raw.trim();
  if (!text) return null;

  const place = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (place) return pin(Number(place[1]), Number(place[2]));

  const dms = fromDms(text);
  if (dms) return dms;

  // Query-style links: q=, query=, ll=, sll=, daddr=, destination=, and geo:.
  const query = text.match(
    /(?:[?&](?:q|query|ll|sll|daddr|destination|center)=|geo:)(-?\d+(?:\.\d+)?)(?:,|%2C)\s*(?:\+|%20)?(-?\d+(?:\.\d+)?)/i
  );
  if (query) return pin(Number(query[1]), Number(query[2]));

  // /maps/search/30.98,+28.76 and /maps/dir//30.98,28.76
  const path = text.match(/\/maps\/(?:search|dir|place)\/+(-?\d+(?:\.\d+)?),\s*\+?(-?\d+(?:\.\d+)?)/i);
  if (path) return pin(Number(path[1]), Number(path[2]));

  const centre = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (centre) return pin(Number(centre[1]), Number(centre[2]));

  // Bare coordinates: two decimals, comma or space between. Decimals required,
  // so "Villa 12, 3" is not a pin in the Gulf of Guinea.
  const bare = text.match(/^\(?\s*(-?\d{1,2}\.\d+)\s*[,\s]\s*(-?\d{1,3}\.\d+)\s*\)?$/);
  if (bare) return pin(Number(bare[1]), Number(bare[2]));

  return null;
}

/** Whether text is a Google Maps short link, which needs expanding on the server. */
export function isShortMapLink(raw: string): boolean {
  try {
    const url = new URL(raw.trim());
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'maps.app.goo.gl' || (url.hostname === 'goo.gl' && url.pathname.startsWith('/maps')))
    );
  } catch {
    return false;
  }
}
