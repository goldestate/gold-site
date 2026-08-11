export type PropertyTypeValue = 'primary' | 'rental' | 'resale';
export type UnitTypeValue =
  | 'chalet'
  | 'apartment'
  | 'townhouse'
  | 'twinhouse'
  | 'villa'
  | 'commercial'
  | 'administrative';
export type LocationValue = 'north-coast' | 'sheikh-zayed' | 'new-cairo' | 'ain-sokhna' | 'gouna';

type TaxonomyOption<T extends string> = {
  value: T;
  en: string;
  ar: string;
};

export const PROPERTY_TYPES: TaxonomyOption<PropertyTypeValue>[] = [
  { value: 'primary', en: 'Primary', ar: 'أساسي' },
  { value: 'rental', en: 'Rental', ar: 'إيجار' },
  { value: 'resale', en: 'Resale', ar: 'إعادة بيع' }
];

export const UNIT_TYPES: TaxonomyOption<UnitTypeValue>[] = [
  { value: 'chalet', en: 'Chalet', ar: 'شاليه' },
  { value: 'apartment', en: 'Apartment', ar: 'شقة' },
  { value: 'townhouse', en: 'Townhouse', ar: 'تاون هاوس' },
  { value: 'twinhouse', en: 'Twinhouse', ar: 'توين هاوس' },
  { value: 'villa', en: 'Villa', ar: 'فيلا' },
  { value: 'commercial', en: 'Commercial', ar: 'تجاري' },
  { value: 'administrative', en: 'Administrative', ar: 'إداري' }
];

export const LOCATIONS: TaxonomyOption<LocationValue>[] = [
  { value: 'north-coast', en: 'North Coast', ar: 'الساحل الشمالي' },
  { value: 'sheikh-zayed', en: 'Sheikh Zayed', ar: 'الشيخ زايد' },
  { value: 'new-cairo', en: 'New Cairo', ar: 'القاهرة الجديدة' },
  { value: 'ain-sokhna', en: 'Ain Sokhna', ar: 'العين السخنة' },
  { value: 'gouna', en: 'Gouna', ar: 'الجونة' }
];

export const PROPERTY_TYPE_VALUES = PROPERTY_TYPES.map((item) => item.value);
export const UNIT_TYPE_VALUES = UNIT_TYPES.map((item) => item.value);
export const LOCATION_VALUES = LOCATIONS.map((item) => item.value);

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

export function propertyTypeLabel(value: PropertyTypeValue, locale: 'en' | 'ar'): string {
  return PROPERTY_TYPES.find((item) => item.value === value)?.[locale] ?? value;
}

export function unitTypeLabel(value: UnitTypeValue, locale: 'en' | 'ar'): string {
  return UNIT_TYPES.find((item) => item.value === value)?.[locale] ?? value;
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
