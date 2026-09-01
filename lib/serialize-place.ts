import type { Place } from './directory-store';

/** The wire shape shared by the public places endpoint and the unlock endpoint. */
export function serializePlace(place: Place) {
  return {
    id: place.id,
    category: place.category,
    name_en: place.nameEn,
    name_ar: place.nameAr,
    phone: place.phone,
    whatsapp: place.whatsapp,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    tier: place.tier,
    notes_en: place.notesEn,
    notes_ar: place.notesAr,
    sort_order: place.sortOrder
  };
}
