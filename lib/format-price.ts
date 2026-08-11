export function formatPrice(price: number, locale: 'en' | 'ar'): string {
  const millions = price / 1_000_000;
  const rounded = Number.isInteger(millions) ? millions.toString() : millions.toFixed(1);

  if (locale === 'ar') {
    return price >= 1_000_000 ? `${rounded} مليون جنيه` : `${price.toLocaleString('ar-EG')} جنيه`;
  }

  return price >= 1_000_000 ? `EGP ${rounded}M` : `EGP ${price.toLocaleString('en-US')}`;
}
