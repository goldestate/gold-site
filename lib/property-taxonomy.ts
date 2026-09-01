export type PropertyTypeValue = 'primary' | 'rental' | 'resale' | 'commercial' | 'administrative';
export type UnitTypeValue =
  | 'studio'
  | 'cabin'
  | 'chalet'
  | 'apartment'
  | 'duplex'
  | 'penthouse'
  | 'townhouse'
  | 'twinhouse'
  | 'villa'
  | 'clinic'
  | 'office'
  | 'commercial';
export type LocationValue = 'north-coast' | 'sheikh-zayed' | 'new-cairo' | 'ain-sokhna' | 'gouna';
/** How a listing's `price` should be read. Stored per row -- never derived from property type. */
export type PricePeriodValue = 'daily' | 'monthly' | 'quarterly' | 'yearly' | 'total';

type TaxonomyOption<T extends string> = {
  value: T;
  en: string;
  ar: string;
};

export const PROPERTY_TYPES: TaxonomyOption<PropertyTypeValue>[] = [
  { value: 'primary', en: 'Primary', ar: 'أساسي' },
  { value: 'rental', en: 'Rental', ar: 'إيجار' },
  { value: 'resale', en: 'Resale', ar: 'إعادة بيع' },
  { value: 'commercial', en: 'Commercial', ar: 'تجاري' },
  { value: 'administrative', en: 'Administrative', ar: 'إداري' }
];

// Ordered smallest-to-largest residential, then commercial-use units; the
// filter chips, the admin form, and the contact form all render this order.
export const UNIT_TYPES: TaxonomyOption<UnitTypeValue>[] = [
  { value: 'studio', en: 'Studio', ar: 'استوديو' },
  { value: 'cabin', en: 'Cabin', ar: 'كابينة' },
  { value: 'chalet', en: 'Chalet', ar: 'شاليه' },
  { value: 'apartment', en: 'Apartment', ar: 'شقة' },
  { value: 'duplex', en: 'Duplex', ar: 'دوبلكس' },
  { value: 'penthouse', en: 'Penthouse', ar: 'بنتهاوس' },
  { value: 'townhouse', en: 'Townhouse', ar: 'تاون هاوس' },
  { value: 'twinhouse', en: 'Twinhouse', ar: 'توين هاوس' },
  { value: 'villa', en: 'Villa', ar: 'فيلا' },
  { value: 'clinic', en: 'Clinic', ar: 'عيادة' },
  { value: 'office', en: 'Office', ar: 'مكتب' },
  { value: 'commercial', en: 'Commercial', ar: 'تجاري' }
];

export const LOCATIONS: TaxonomyOption<LocationValue>[] = [
  { value: 'north-coast', en: 'North Coast', ar: 'الساحل الشمالي' },
  { value: 'sheikh-zayed', en: 'Sheikh Zayed', ar: 'الشيخ زايد' },
  { value: 'new-cairo', en: 'New Cairo', ar: 'القاهرة الجديدة' },
  { value: 'ain-sokhna', en: 'Ain Sokhna', ar: 'العين السخنة' },
  { value: 'gouna', en: 'Gouna', ar: 'الجونة' }
];

// Ordered shortest-to-longest tenure, then the sale case. Rendered by the admin
// form's period select; `total` is the sale price and shows no suffix.
export const PRICE_PERIODS: TaxonomyOption<PricePeriodValue>[] = [
  { value: 'daily', en: 'Per day', ar: 'يومي' },
  { value: 'monthly', en: 'Per month', ar: 'شهري' },
  { value: 'quarterly', en: 'Quarterly instalments', ar: 'ربع سنوي' },
  { value: 'yearly', en: 'Per year', ar: 'سنوي' },
  { value: 'total', en: 'Total price (sale)', ar: 'السعر الإجمالي' }
];

export const PROPERTY_TYPE_VALUES = PROPERTY_TYPES.map((item) => item.value);
export const UNIT_TYPE_VALUES = UNIT_TYPES.map((item) => item.value);
export const LOCATION_VALUES = LOCATIONS.map((item) => item.value);
export const PRICE_PERIOD_VALUES = PRICE_PERIODS.map((item) => item.value);

export const BEDROOM_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;
export const BATHROOM_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function isPropertyType(value: unknown): value is PropertyTypeValue {
  return typeof value === 'string' && (PROPERTY_TYPE_VALUES as string[]).includes(value);
}

export function isUnitType(value: unknown): value is UnitTypeValue {
  return typeof value === 'string' && (UNIT_TYPE_VALUES as string[]).includes(value);
}

export function isLocation(value: unknown): value is LocationValue {
  return typeof value === 'string' && (LOCATION_VALUES as string[]).includes(value);
}

export function isPricePeriod(value: unknown): value is PricePeriodValue {
  return typeof value === 'string' && (PRICE_PERIOD_VALUES as string[]).includes(value);
}

export function propertyTypeLabel(value: PropertyTypeValue, locale: 'en' | 'ar'): string {
  return PROPERTY_TYPES.find((item) => item.value === value)?.[locale] ?? value;
}

export function unitTypeLabel(value: UnitTypeValue, locale: 'en' | 'ar'): string {
  return UNIT_TYPES.find((item) => item.value === value)?.[locale] ?? value;
}

export function pricePeriodLabel(value: PricePeriodValue, locale: 'en' | 'ar'): string {
  return PRICE_PERIODS.find((item) => item.value === value)?.[locale] ?? value;
}

const PRICE_PERIOD_SUFFIXES: Record<PricePeriodValue, { en: string; ar: string }> = {
  daily: { en: '/Day', ar: '/اليوم' },
  monthly: { en: '/Month', ar: '/الشهر' },
  quarterly: { en: '/Q-Annual', ar: '/ربع سنوي' },
  yearly: { en: '/Year', ar: '/السنة' },
  total: { en: '', ar: '' }
};

/**
 * The suffix shown after a price. Read from the row's stored `pricePeriod` -- it is
 * deliberately NOT derived from propertyType: a monthly rental once rendered as "/Day",
 * understating it ~30x. Never reintroduce a propertyType-based branch here.
 */
export function priceSuffixLabel(pricePeriod: PricePeriodValue, locale: 'en' | 'ar'): string {
  return PRICE_PERIOD_SUFFIXES[pricePeriod]?.[locale] ?? '';
}

export function showsArea(propertyType: PropertyTypeValue): boolean {
  return propertyType !== 'rental';
}

export function locationLabel(value: LocationValue, locale: 'en' | 'ar'): string {
  return LOCATIONS.find((item) => item.value === value)?.[locale] ?? value;
}

const LEGACY_LOCATION_MATCHES: Array<{ pattern: RegExp; value: LocationValue }> = [
  { pattern: /north\s*coast/i, value: 'north-coast' },
  { pattern: /sheikh\s*zayed/i, value: 'sheikh-zayed' },
  { pattern: /new\s*cairo|5th\s*settlement|fifth\s*settlement/i, value: 'new-cairo' },
  { pattern: /ain\s*sokhna|sokhna/i, value: 'ain-sokhna' },
  { pattern: /gouna/i, value: 'gouna' }
];

export function normalizeLegacyLocation(value: unknown): LocationValue {
  if (isLocation(value)) return value;
  if (typeof value === 'string') {
    const match = LEGACY_LOCATION_MATCHES.find((entry) => entry.pattern.test(value));
    if (match) return match.value;
  }
  return 'new-cairo';
}
