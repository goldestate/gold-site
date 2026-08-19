export type RentalPropertyTypeValue = 'apartment' | 'villa' | 'office' | 'retail' | 'chalet' | 'other';
export type RentalPeriodValue = 'monthly' | 'yearly' | 'short_term';
export type RentalListingStatusValue = 'pending_review' | 'active' | 'rented' | 'inactive';
export type RentalRequestStatusValue = 'new' | 'matching' | 'matches_sent' | 'closed' | 'expired';

type TaxonomyOption<T extends string> = {
  value: T;
  en: string;
  ar: string;
};

export const RENTAL_PROPERTY_TYPES: TaxonomyOption<RentalPropertyTypeValue>[] = [
  { value: 'apartment', en: 'Apartment', ar: 'شقة' },
  { value: 'villa', en: 'Villa', ar: 'فيلا' },
  { value: 'office', en: 'Office', ar: 'مكتب' },
  { value: 'retail', en: 'Retail', ar: 'محل تجاري' },
  { value: 'chalet', en: 'Chalet', ar: 'شاليه' },
  { value: 'other', en: 'Other', ar: 'أخرى' }
];

export const RENTAL_PERIODS: TaxonomyOption<RentalPeriodValue>[] = [
  { value: 'monthly', en: 'Monthly', ar: 'شهري' },
  { value: 'yearly', en: 'Yearly', ar: 'سنوي' },
  { value: 'short_term', en: 'Short-term', ar: 'قصير الأجل' }
];

const RENTAL_PROPERTY_TYPE_VALUES = RENTAL_PROPERTY_TYPES.map((item) => item.value);
const RENTAL_PERIOD_VALUES = RENTAL_PERIODS.map((item) => item.value);

export function isRentalPropertyType(value: unknown): value is RentalPropertyTypeValue {
  return typeof value === 'string' && (RENTAL_PROPERTY_TYPE_VALUES as string[]).includes(value);
}

export function isRentalPeriod(value: unknown): value is RentalPeriodValue {
  return typeof value === 'string' && (RENTAL_PERIOD_VALUES as string[]).includes(value);
}

export function rentalPropertyTypeLabel(value: RentalPropertyTypeValue, locale: 'en' | 'ar'): string {
  return RENTAL_PROPERTY_TYPES.find((item) => item.value === value)?.[locale] ?? value;
}

export function rentalPeriodLabel(value: RentalPeriodValue, locale: 'en' | 'ar'): string {
  return RENTAL_PERIODS.find((item) => item.value === value)?.[locale] ?? value;
}

// Admin panel is English-only, so these statuses don't need Arabic labels.
export const RENTAL_LISTING_STATUSES: { value: RentalListingStatusValue; label: string }[] = [
  { value: 'pending_review', label: 'Pending review' },
  { value: 'active', label: 'Active' },
  { value: 'rented', label: 'Rented' },
  { value: 'inactive', label: 'Inactive' }
];

const RENTAL_LISTING_STATUS_VALUES = RENTAL_LISTING_STATUSES.map((item) => item.value);

export function isRentalListingStatus(value: unknown): value is RentalListingStatusValue {
  return typeof value === 'string' && (RENTAL_LISTING_STATUS_VALUES as string[]).includes(value);
}

export function rentalListingStatusLabel(value: RentalListingStatusValue): string {
  return RENTAL_LISTING_STATUSES.find((item) => item.value === value)?.label ?? value;
}

export const RENTAL_REQUEST_STATUS_LABELS: Record<RentalRequestStatusValue, string> = {
  new: 'New',
  matching: 'Matching',
  matches_sent: 'Matches sent',
  closed: 'Closed',
  expired: 'Expired'
};
