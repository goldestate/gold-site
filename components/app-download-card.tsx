import Image from 'next/image';
import { APP_STORE_URL } from '@/lib/app-links';
import type { SiteCopy } from '@/lib/site-content';

/**
 * Apple's own badge artwork, exactly as App Store Marketing Tools serves it for
 * this app: the black badge (Apple's preferred version; the gray rim is part of
 * the artwork), one file per language. Apple's rules for it, which this card is
 * laid out around: never redrawn, recoloured, cropped or animated; at least
 * 40px tall on screen; and a clear space of a quarter of its height (11px here)
 * that no text or graphic enters. "App Store" stays in English on the Arabic
 * badge -- that is Apple's artwork, not a missing translation.
 */
const BADGE: Record<'en' | 'ar', string> = {
  en: '/badges/app-store-badge-en.svg',
  ar: '/badges/app-store-badge-ar.svg'
};

/**
 * The app, offered in the footer of every page. The whole card is one link, so
 * a thumb anywhere on it opens the App Store.
 *
 * The QR code only shows on wide screens: a computer can't install an iPhone
 * app, so on a desk the useful thing is to hand it to the phone. It encodes the
 * same product page as APP_STORE_URL; regenerate it if the app ever moves.
 */
export function AppDownloadCard({
  copy,
  locale
}: {
  copy: SiteCopy['footer']['app'];
  locale: 'en' | 'ar';
}) {
  if (!APP_STORE_URL) return null;

  const isRtl = locale === 'ar';

  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={copy.linkLabel}
      className="mt-8 flex max-w-lg items-start gap-4 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-[rgba(217,179,85,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B355] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171314] sm:gap-5 sm:p-6"
    >
      <Image
        src="/app-icon.png"
        alt=""
        width={64}
        height={64}
        // The icon file has its rounded corners drawn in; the radius here only
        // shapes the hairline so it follows them on the dark card.
        className="h-14 w-14 flex-none rounded-[22.37%] ring-1 ring-white/10 sm:h-16 sm:w-16"
      />

      <div className="min-w-0 flex-1">
        {/* Baskerville is the brand's accent face, but it has no Arabic letters. */}
        <p className={`text-lg leading-7 text-white ${isRtl ? 'font-medium' : 'font-serif'}`}>{copy.title}</p>
        <p className="mt-1.5 text-sm leading-6 text-white/62">{copy.body}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BADGE[locale]} alt="" width={132} height={44} className="mt-4 h-11 w-auto" />
      </div>

      <div className="hidden flex-none flex-col items-center gap-2.5 border-s border-white/10 ps-5 lg:flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/badges/app-store-qr.svg" alt="" width={104} height={104} className="h-[104px] w-[104px] rounded-xl" />
        <span className="max-w-[7.5rem] text-center text-[11px] leading-4 text-white/48">{copy.scanHint}</span>
      </div>
    </a>
  );
}
