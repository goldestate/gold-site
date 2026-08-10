export function formatPriceRange(priceMin: number, priceMax: number | null, locale: 'en' | 'ar'): string {
  const format = (value: number) => formatSingle(value, locale);

  if (priceMax && priceMax > priceMin) {
    return locale === 'ar'
      ? `${format(priceMin)} - ${format(priceMax)}`
      : `${format(priceMin)} - ${format(priceMax)}`;
  }

  return format(priceMin);
}

function formatSingle(value: number, locale: 'en' | 'ar'): string {
  const millions = value / 1_000_000;
  const rounded = Number.isInteger(millions) ? millions.toString() : millions.toFixed(1);

  if (locale === 'ar') {
    return value >= 1_000_000 ? `${rounded} مليون جنيه` : `${value.toLocaleString('ar-EG')} جنيه`;
  }

  return value >= 1_000_000 ? `EGP ${rounded}M` : `EGP ${value.toLocaleString('en-US')}`;
}
