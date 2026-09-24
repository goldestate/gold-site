export type PlaceTierValue = 'public' | 'vetted';

export type PlaceCategoryValue =
  | 'emergency'
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
  | 'handyman'
  | 'other';

type TaxonomyOption<T extends string> = {
  value: T;
  en: string;
  ar: string;
};

/**
 * The tier is about privacy, not visibility. In the app a guest sees nothing for a
 * compound until they redeem a code, and then sees both tiers. What differs is who
 * else can get the number: public rows are also served by the open places endpoint,
 * and are the ones every compound nearby shares; private ('vetted') rows only ever
 * reach a phone holding a live code for this compound, and leave it when the code
 * ends.
 * The stored value stays 'vetted' -- the app and the database both read it.
 */
export const PLACE_TIERS: TaxonomyOption<PlaceTierValue>[] = [
  { value: 'public', en: 'Public - anyone can look it up', ar: 'عام - يمكن لأي شخص الاطلاع عليه' },
  { value: 'vetted', en: 'Private - only phones with a live code', ar: 'خاص - فقط للهواتف التي لديها رمز ساري' }
];

/** The short word staff see on a pill or chip. */
export function tierLabel(tier: PlaceTierValue): string {
  return tier === 'public' ? 'Public' : 'Private';
}

/**
 * `defaultTier` only preselects the tier in the admin -- it is stored per place,
 * so staff can always override it. Numbers anyone could find on a map or a shop
 * sign default to public; GOLD's own people and the compound's own contacts
 * default to private.
 *
 * English labels match what guests see in the app (PlaceCategory.en), so the
 * word staff pick is the word on the guest's screen. The values never change:
 * the app and the database both key on them.
 */
export const PLACE_CATEGORIES: (TaxonomyOption<PlaceCategoryValue> & { defaultTier: PlaceTierValue })[] = [
  { value: 'emergency', en: 'Emergency', ar: 'طوارئ', defaultTier: 'public' },
  { value: 'hospital', en: 'Hospital', ar: 'مستشفى', defaultTier: 'public' },
  { value: 'clinic', en: 'Clinic', ar: 'عيادة', defaultTier: 'public' },
  { value: 'pharmacy', en: 'Pharmacy', ar: 'صيدلية', defaultTier: 'public' },
  { value: 'supermarket', en: 'Supermarket', ar: 'سوبر ماركت', defaultTier: 'public' },
  { value: 'bakery', en: 'Bakery', ar: 'مخبز', defaultTier: 'public' },
  { value: 'atm', en: 'Bank & ATM', ar: 'بنك وماكينة صراف', defaultTier: 'public' },
  { value: 'petrol', en: 'Petrol', ar: 'محطة بنزين', defaultTier: 'public' },
  { value: 'restaurant', en: 'Restaurants', ar: 'مطاعم', defaultTier: 'public' },
  { value: 'cafe', en: 'Cafés', ar: 'كافيهات', defaultTier: 'public' },
  { value: 'gym', en: 'Gym', ar: 'جيم', defaultTier: 'public' },
  { value: 'salon', en: 'Salon', ar: 'صالون', defaultTier: 'public' },
  { value: 'vet', en: 'Vet', ar: 'طبيب بيطري', defaultTier: 'public' },
  { value: 'mall', en: 'Mall', ar: 'مول', defaultTier: 'public' },
  { value: 'security', en: 'Security', ar: 'الأمن', defaultTier: 'vetted' },
  { value: 'maintenance', en: 'Maintenance', ar: 'الصيانة', defaultTier: 'vetted' },
  { value: 'plumber', en: 'Plumber', ar: 'سباك', defaultTier: 'vetted' },
  { value: 'electrician', en: 'Electrician', ar: 'كهربائي', defaultTier: 'vetted' },
  { value: 'ac', en: 'AC technician', ar: 'فني تكييف', defaultTier: 'vetted' },
  { value: 'cleaner', en: 'Cleaning', ar: 'تنظيف', defaultTier: 'vetted' },
  { value: 'pool', en: 'Pool service', ar: 'صيانة حمام السباحة', defaultTier: 'vetted' },
  { value: 'handyman', en: 'Handyman', ar: 'صنايعي', defaultTier: 'vetted' },
  // The compound's own, like its gate and its office, and filed with them in the
  // app: the app in the App Store only shows a clubhouse saved as private.
  { value: 'clubhouse', en: 'Clubhouse', ar: 'النادي', defaultTier: 'vetted' },
  // Private by default: a number nobody could name a category for is more likely
  // a person than a shop.
  { value: 'other', en: 'Other', ar: 'أخرى', defaultTier: 'vetted' }
];

export const PLACE_CATEGORY_VALUES = PLACE_CATEGORIES.map((item) => item.value);
export const PLACE_TIER_VALUES = PLACE_TIERS.map((item) => item.value);

/**
 * The categories a compound's list is measured against. Emergency and Other are
 * left out: the app already ships the national emergency numbers, and "Other" is
 * a catch-all, so neither is a gap worth nagging staff about.
 */
export const COVERAGE_CATEGORIES = PLACE_CATEGORIES.filter(
  (item) => item.value !== 'emergency' && item.value !== 'other'
);

export function isCoverageCategory(value: PlaceCategoryValue): boolean {
  return value !== 'emergency' && value !== 'other';
}

/**
 * Numbers that belong to one compound: its own gate, its own facility management,
 * its own clubhouse. Copying these to another compound would put Marassi's gate
 * on Azha's list, so copy menus leave them behind whatever their tier.
 */
export const COMPOUND_SPECIFIC_CATEGORIES: PlaceCategoryValue[] = ['security', 'maintenance', 'clubhouse'];

export function isCompoundSpecific(value: PlaceCategoryValue): boolean {
  return COMPOUND_SPECIFIC_CATEGORIES.includes(value);
}

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
  // Anything unknown falls closed, like the app and the store do with tiers.
  return PLACE_CATEGORIES.find((item) => item.value === category)?.defaultTier ?? 'vetted';
}

/** Two entries are the same place when they share a category and a name, whatever the capitals. */
export function placeKey(item: { category: string; nameEn: string }): string {
  return `${item.category}|${item.nameEn.trim().toLowerCase()}`;
}

/**
 * What the app now in the App Store can draw. It lists public places only under
 * the categories it files as public, private places only under the ones it files
 * as private, and has no Other section at all -- so a private pharmacy, a public
 * plumber or anything under Other is saved and sent to the phone, and then no
 * screen shows it. The next app release lists every category in both sections;
 * until guests have it, the admin says so wherever such a place is made.
 * Mirrors PlaceCategory.publicOrder and vettedOrder in the released app.
 */
const SHIPPED_APP_SECTIONS: Record<PlaceTierValue, PlaceCategoryValue[]> = {
  public: ['emergency', 'pharmacy', 'hospital', 'clinic', 'supermarket', 'bakery', 'atm', 'petrol', 'restaurant', 'cafe', 'gym', 'salon', 'vet', 'mall'],
  vetted: ['security', 'maintenance', 'plumber', 'electrician', 'ac', 'cleaner', 'pool', 'handyman', 'clubhouse']
};

/** One line for staff when guests on the current app version would not see this place, or null when they would. */
export function currentAppNote(category: PlaceCategoryValue, tier: PlaceTierValue): string | null {
  if (SHIPPED_APP_SECTIONS[tier].includes(category)) return null;
  const why =
    category === 'other'
      ? 'it has no Other section'
      : `it lists ${placeCategoryLabel(category, 'en')} only as ${tierLabel(tier === 'public' ? 'vetted' : 'public')}`;
  return `Guests on the current app version will not see this until the next app update: ${why}.`;
}

/**
 * Words that give a pasted line's category away. First match wins, so the more
 * specific words come first: "Pool club" is pool service, "Vet clinic" is a vet,
 * "Emergency plumber" is a plumber, and "Gate 2 pharmacy" is a pharmacy rather
 * than security. It only fills in the preview, where every guess can be changed
 * before anything is saved.
 *
 * Keys are compared against whole words, never substrings: substring matching
 * read "Fatma" as an ATM, "Badr" as a doctor and "محمول" (mobile) as a mall, and
 * because the tier follows the category, a cleaner's personal number came out
 * public. A plain key must equal a word ("atm", "مول"); a key ending in * is a
 * stem and matches the start of a word ("plumb*" for plumber, plumbing); a key
 * with a space is consecutive words ("gas station").
 */
const CATEGORY_KEYWORDS: [PlaceCategoryValue, string[]][] = [
  ['plumber', ['plumb*', 'سباك*']],
  ['electrician', ['electric*', 'كهربا*', 'كهربي']],
  ['ac', ['ac', 'air con*', 'aircon*', 'hvac', 'تكييف*', 'تكيف*']],
  ['pool', ['pool', 'pools', 'حمام سباحة', 'سباحة', 'بيسين', 'بسين']],
  ['cleaner', ['clean*', 'housekeep*', 'maid', 'maids', 'نظافة', 'تنظيف', 'تنضيف']],
  ['handyman', ['handyman', 'handymen', 'handy man', 'carpent*', 'painter*', 'نجار*', 'نقاش*', 'صنايعي', 'صنايعية']],
  ['vet', ['vet', 'vets', 'veterin*', 'animal*', 'pet', 'pets', 'بيطري*']],
  ['pharmacy', ['pharma*', 'صيدلي*', 'اجزخانة']],
  ['hospital', ['hospital*', 'مستشفي*', 'مستشفيات']],
  ['clinic', ['clinic*', 'doctor*', 'dr', 'dental', 'dentist*', 'عيادة', 'عيادات', 'دكتور*']],
  ['security', ['security', 'gate', 'gates', 'guard', 'guards', 'امن', 'بوابة', 'حراسة', 'حارس']],
  ['maintenance', ['maintenance', 'facility', 'facilities', 'صيانة']],
  ['emergency', ['emergency', 'ambulance*', 'police', 'fire brigade', 'طوارئ', 'اسعاف', 'شرطة', 'مطافي', 'نجدة']],
  // Not "baker*" or "market*": Baker is a surname, and "Marketing" is not a shop.
  ['bakery', ['bakery', 'bakeries', 'bread', 'مخبز', 'مخابز', 'فرن', 'افران', 'عيش']],
  [
    'supermarket',
    ['supermarket*', 'hypermarket*', 'minimarket*', 'market', 'markets', 'grocer*', 'carrefour', 'spinneys', 'kheir zaman', 'ماركت', 'سوبرماركت', 'بقالة', 'هايبر']
  ],
  ['atm', ['atm', 'atms', 'bank', 'banks', 'صراف', 'بنك', 'بنوك']],
  ['petrol', ['petrol', 'gas station', 'fuel', 'wataniya', 'totalenergies', 'بنزين', 'بنزينة', 'وقود']],
  ['cafe', ['cafe', 'cafes', 'café', 'cafés', 'coffee', 'كافيه', 'كافيهات', 'كافية', 'قهوة']],
  ['restaurant', ['restaurant*', 'grill*', 'pizza*', 'burger*', 'sushi', 'مطعم', 'مطاعم']],
  ['gym', ['gym', 'gyms', 'fitness', 'crossfit', 'جيم']],
  ['salon', ['salon*', 'barber*', 'hairdress*', 'haircut*', 'spa', 'nails', 'كوافير', 'حلاق*', 'صالون']],
  ['mall', ['mall', 'malls', 'مول', 'مولات']],
  ['clubhouse', ['club', 'clubhouse', 'نادي']]
];

/**
 * Folds the spellings people type interchangeably into one: alef forms, ta
 * marbuta and alef maqsura, harakat and tatweel. Latin text is only lowercased.
 */
function foldWord(word: string): string {
  return word
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

/** A word and, for Arabic, the word without its definite article: النادي is also نادي. */
function wordForms(word: string): string[] {
  return word.startsWith('ال') && word.length > 3 ? [word, word.slice(2)] : [word];
}

function tokenize(text: string): string[] {
  return foldWord(text.normalize('NFC').toLowerCase().replace(/\ba\/c\b/g, 'ac'))
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function wordMatches(word: string, key: string): boolean {
  const stem = key.endsWith('*');
  const target = stem ? key.slice(0, -1) : key;
  return wordForms(word).some((form) => (stem ? form.startsWith(target) : form === target));
}

const COMPILED_KEYWORDS: [PlaceCategoryValue, string[][]][] = CATEGORY_KEYWORDS.map(([category, keys]) => [
  category,
  keys.map((key) => key.split(' ').map((part) => foldWord(part.toLowerCase())))
]);

/** Best guess at a pasted line's category, or null when nothing in it says. */
export function guessCategory(text: string): PlaceCategoryValue | null {
  const words = tokenize(text);
  for (const [category, keys] of COMPILED_KEYWORDS) {
    const hit = keys.some((parts) =>
      words.some((_, start) => parts.every((part, offset) => {
        const word = words[start + offset];
        return word !== undefined && wordMatches(word, part);
      }))
    );
    if (hit) return category;
  }
  return null;
}

/**
 * Accepts sloppy input from a WhatsApp paste: lowercase, spaces, missing dashes,
 * the GOLD- prefix left off ("HB-4K2M"), and Arabic-Indic digits from a keyboard
 * set to Arabic. The app sends what the guest typed, so every one of these has to
 * converge on GOLD-XX-XXXX here.
 */
export function normalizeCode(raw: string): string {
  const ascii = raw.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (char) => {
    const code = char.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
  let body = ascii.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Every leading GOLD, not just one: the App Store app puts "GOLD-" in front of
  // anything typed without it, so "goldhb4k2m" arrives as GOLD-GOLDHB4K2M. Safe
  // because the alphabet has no O or L, so a code's own six characters never
  // spell GOLD. The app's DeepLink.normalise does the same.
  while (body.startsWith('GOLD')) body = body.slice(4);
  if (body.length !== 6) return ascii.trim().toUpperCase();
  return `GOLD-${body.slice(0, 2)}-${body.slice(2)}`;
}

/** Whether text is shaped like a code at all, so a landing page never echoes arbitrary URL text. */
export function isCodeShaped(raw: string): boolean {
  // The generator's alphabet (lib/compound-code.ts): no O/0, I/1 or L.
  return /^GOLD-[A-HJKMNP-Z2-9]{2}-[A-HJKMNP-Z2-9]{4}$/.test(normalizeCode(raw));
}

export function slugifyCompound(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
