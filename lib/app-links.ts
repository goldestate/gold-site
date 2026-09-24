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
 * Null until the app is on the App Store. The unlock page reads this: with a URL
 * it shows a download button, without one it falls back to WhatsApp, so the page
 * is never a dead end. Flipping this on is the only change needed at launch.
 */
export const APP_STORE_URL: string | null = null;

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
