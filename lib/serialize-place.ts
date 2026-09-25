import type { Place } from './directory-store';
import { isWhatsAppCapable } from './phone';

/** The wire shape shared by the public places endpoint, the unlock endpoint and entitlements. */
export function serializePlace(place: Place) {
  return {
    id: place.id,
    category: place.category,
    name_en: place.nameEn,
    name_ar: place.nameAr,
    phone: place.phone,
    // Rows saved before the write path checked this still hold landlines (the
    // admin used to copy every phone into whatsapp), and the shipped app shows a
    // WhatsApp button for any 10-digit number. Dropping them here fixes every
    // phone on its next fetch, without an app release or a data migration.
    whatsapp: isWhatsAppCapable(place.whatsapp) ? place.whatsapp : null,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    tier: place.tier,
    notes_en: place.notesEn,
    notes_ar: place.notesAr,
    sort_order: place.sortOrder
  };
}
