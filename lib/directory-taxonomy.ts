export type PlaceTierValue = 'public' | 'vetted';

export type PlaceCategoryValue =
  | 'hospital'
  | 'clinic'
  | 'pharmacy'
  | 'supermarket'
  | 'bakery'
  | 'atm'
  | 'petrol'
  | 'restaurant'
  | 'cafe'
  | 'gym'
  | 'salon'
  | 'vet'
  | 'mall'
  | 'clubhouse'
  | 'security'
  | 'maintenance'
  | 'plumber'
  | 'electrician'
  | 'ac'
  | 'cleaner'
  | 'pool'
  | 'handyman';

type TaxonomyOption<T extends string> = {
  value: T;
  en: string;
  ar: string;
};

export const PLACE_TIERS: TaxonomyOption<PlaceTierValue>[] = [
  { value: 'public', en: 'Public - no code needed', ar: 'عام - بدون رمز' },
  { value: 'vetted', en: 'Vetted - needs a code', ar: 'موثوق - يتطلب رمزاً' }
];

/**
 * `defaultTier` only preselects the toggle in the admin form -- the tier is stored
 * per place, so staff can always override it. Amenities a guest could find on a map
 * default to public; GOLD's own trusted trades default to vetted.
 */
export const PLACE_CATEGORIES: (TaxonomyOption<PlaceCategoryValue> & { defaultTier: PlaceTierValue })[] = [
  { value: 'hospital', en: 'Hospital', ar: 'مستشفى', defaultTier: 'public' },
  { value: 'clinic', en: 'Clinic', ar: 'عيادة', defaultTier: 'public' },
  { value: 'pharmacy', en: 'Pharmacy', ar: 'صيدلية', defaultTier: 'public' },
  { value: 'supermarket', en: 'Supermarket', ar: 'سوبر ماركت', defaultTier: 'public' },
  { value: 'bakery', en: 'Bakery', ar: 'مخبز', defaultTier: 'public' },
  { value: 'atm', en: 'ATM', ar: 'صراف آلي', defaultTier: 'public' },
  { value: 'petrol', en: 'Petrol station', ar: 'محطة وقود', defaultTier: 'public' },
  { value: 'restaurant', en: 'Restaurant', ar: 'مطعم', defaultTier: 'public' },
  { value: 'cafe', en: 'Cafe', ar: 'مقهى', defaultTier: 'public' },
  { value: 'gym', en: 'Gym', ar: 'صالة رياضية', defaultTier: 'public' },
  { value: 'salon', en: 'Salon', ar: 'صالون', defaultTier: 'public' },
  { value: 'vet', en: 'Vet', ar: 'طبيب بيطري', defaultTier: 'public' },
  { value: 'mall', en: 'Mall', ar: 'مول', defaultTier: 'public' },
  { value: 'clubhouse', en: 'Clubhouse', ar: 'النادي', defaultTier: 'public' },
  { value: 'security', en: 'Compound security', ar: 'أمن الكمبوند', defaultTier: 'vetted' },
  { value: 'maintenance', en: 'Compound maintenance', ar: 'صيانة الكمبوند', defaultTier: 'vetted' },
  { value: 'plumber', en: 'Plumber', ar: 'سباك', defaultTier: 'vetted' },
  { value: 'electrician', en: 'Electrician', ar: 'كهربائي', defaultTier: 'vetted' },
  { value: 'ac', en: 'AC technician', ar: 'فني تكييف', defaultTier: 'vetted' },
  { value: 'cleaner', en: 'Cleaner', ar: 'عامل نظافة', defaultTier: 'vetted' },
  { value: 'pool', en: 'Pool service', ar: 'خدمة المسبح', defaultTier: 'vetted' },
  { value: 'handyman', en: 'Handyman', ar: 'فني صيانة', defaultTier: 'vetted' }
];

export const PLACE_CATEGORY_VALUES = PLACE_CATEGORIES.map((item) => item.value);
export const PLACE_TIER_VALUES = PLACE_TIERS.map((item) => item.value);

export function isPlaceCategory(value: unknown): value is PlaceCategoryValue {
  return typeof value === 'string' && (PLACE_CATEGORY_VALUES as string[]).includes(value);
}

export function isPlaceTier(value: unknown): value is PlaceTierValue {
  return typeof value === 'string' && (PLACE_TIER_VALUES as string[]).includes(value);
}

export function placeCategoryLabel(value: PlaceCategoryValue, locale: 'en' | 'ar'): string {
  return PLACE_CATEGORIES.find((item) => item.value === value)?.[locale] ?? value;
}

export function defaultTierFor(category: PlaceCategoryValue): PlaceTierValue {
  return PLACE_CATEGORIES.find((item) => item.value === category)?.defaultTier ?? 'public';
}

/** Accepts sloppy input from a WhatsApp paste: lowercase, spaces, missing dashes. */
export function normalizeCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned.startsWith('GOLD') || cleaned.length !== 10) return raw.trim().toUpperCase();
  return `GOLD-${cleaned.slice(4, 6)}-${cleaned.slice(6)}`;
}

export function slugifyCompound(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
