/**
 * Identity of the iOS app, shared by the apple-app-site-association route and
 * the /unlock landing page.
 *
 * APP_ID is <team id>.<bundle id>. The team id comes from the signing
 * credentials on the build machine (Apple Distribution: karim fahmy). If GOLD
 * ever signs under a second developer account this value changes, and the
 * failure mode is silent — universal links simply stop opening the app, with no
 * error anywhere. Change it here and nowhere else.
 */
export const APPLE_TEAM_ID = 'YLR835P87U';
export const IOS_BUNDLE_ID = 'com.goldeg.app';
export const APP_ID = `${APPLE_TEAM_ID}.${IOS_BUNDLE_ID}`;

/**
 * The app's App Store page, or null when it isn't there. The unlock page shows a
 * download button with it and falls back to WhatsApp without it, so the page is
 * never a dead end; the footer links it on every page.
 *
 * Country-neutral on purpose: apps.apple.com/app/... opens each visitor's own
 * store, where /eg/ or /us/ would send an Egyptian iPhone to the US storefront.
 */
export const APP_STORE_URL: string | null = 'https://apps.apple.com/app/gold-eg/id6809770355';

/** The custom scheme. Works today, without the app-site-association file. */
export function appSchemeUnlockUrl(code: string): string {
  return `goldeg://unlock?code=${encodeURIComponent(code)}`;
}

/** The universal link staff send. */
export function unlockUrl(code: string): string {
  return `https://gold-eg.com/unlock/${encodeURIComponent(code)}`;
}

/**
 * The message staff send a guest. Built here rather than typed by hand each
 * time: the link is the point of the whole universal-link setup, and a code
 * pasted on its own is a code the guest has to retype.
 *
 * Bilingual in one message because staff do not know which language a given
 * guest reads, and asking them to choose is one more decision per send. Each
 * half names the compound in its own language; the Arabic falls back to the
 * English name when a compound has none.
 */
export function inviteMessage(code: string, nameEn: string, nameAr?: string): string {
  const link = unlockUrl(code);
  const arabicName = nameAr?.trim() || nameEn;
  return [
    `Your GOLD compound guide for ${nameEn}.`,
    '',
    `Open this link: ${link}`,
    `Or enter this code in the GOLD app: ${code}`,
    '',
    '—',
    '',
    `دليل الكمبوند من جولد في ${arabicName}.`,
    '',
    `افتح الرابط: ${link}`,
    `أو أدخل هذا الكود في تطبيق جولد: ${code}`
  ].join('\n');
}

/** Opens WhatsApp on the contact picker with the invite already written. */
export function whatsappComposeUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
