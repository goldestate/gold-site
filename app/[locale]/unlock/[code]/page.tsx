import type { Metadata } from 'next';
import { OG_LOCALE, SHARE_IMAGE, getSiteCopy } from '@/lib/site-content';
import { isCodeShaped, normalizeCode } from '@/lib/directory-taxonomy';
import { APP_STORE_URL, appSchemeUnlockUrl } from '@/lib/app-links';
import { type Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { PageShell } from '@/components/page-shell';

/**
 * Where an unlock link lands when it does not open the app.
 *
 * With the app installed, iOS matches /unlock/* against the
 * apple-app-site-association file and this page is never seen. So most people
 * who see it do NOT have the app: nobody on Android (there is no Android app),
 * and, until launch, nobody at all. The first button is therefore one that works
 * for them -- the App Store once APP_STORE_URL is set, and WhatsApp to GOLD
 * always, because Android guests and anyone who can't install need it after
 * launch too. "Open it" (the goldeg:// scheme) is offered to people who say they
 * already have the app: a universal link is also defeated by being typed into
 * Safari or followed inside an in-app browser, and for them it is one tap. For
 * everyone else a custom scheme fails with "address is invalid" or silently,
 * which is why it can't be the main button.
 *
 * This page deliberately does NOT look the code up. /api/unlock returns a
 * byte-identical 404 for unknown and inactive codes so that guessing tells an
 * attacker nothing; a page that said "invalid code" in the browser would hand
 * back exactly the oracle that route is written to withhold. It does check the
 * code's SHAPE, which needs no lookup: anything else in the URL is never shown,
 * so gold-eg.com can't be made to display "PAY EGP 500 TO ..." as someone's code.
 */

const WHATSAPP_NUMBER = '201066377883';

type Params = { locale: Locale; code: string };

/**
 * Link previews are built from this, and the invite staff send on WhatsApp is
 * the first thing a guest sees of GOLD. The code stays out of it: previews are
 * forwarded and screenshotted along with the message.
 */
export function generateMetadata({ params }: { params: Params }): Metadata {
  const t = getSiteCopy(params.locale).unlockPage;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    // Unlock links are private and sent one to one. They should never be indexed.
    robots: { index: false, follow: false },
    openGraph: {
      type: 'website',
      siteName: 'GOLD',
      title: t.metaTitle,
      description: t.metaDescription,
      locale: OG_LOCALE[params.locale],
      images: [{ ...SHARE_IMAGE, alt: 'GOLD' }]
    },
    twitter: {
      card: 'summary',
      title: t.metaTitle,
      description: t.metaDescription,
      images: [SHARE_IMAGE.url]
    }
  };
}

/** The URL segment as text, or null when it isn't valid percent-encoding. */
function decodeSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

function whatsappLink(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export default function UnlockPage({ params }: { params: Params }) {
  const { locale } = params;
  const copy = getSiteCopy(locale);
  const t = copy.unlockPage;
  const isRtl = locale === 'ar';
  const otherLocale: Locale = locale === 'en' ? 'ar' : 'en';

  // Same normalisation the app and /api/unlock apply, so a link that arrived
  // lower-cased, without dashes or in Arabic-Indic digits still shows the
  // canonical code. Null when the URL doesn't carry one: then nothing from it
  // is displayed or sent anywhere.
  const decoded = decodeSegment(params.code);
  const code = decoded !== null && isCodeShaped(decoded) ? normalizeCode(decoded) : null;

  const whatsappHref = whatsappLink(
    code ? t.whatsappMessage.replace('{code}', code) : t.whatsappMessageNoCode
  );

  // Capitals and letter-spacing are for the Latin labels only: spacing Arabic
  // letters apart breaks the joins between them, so Arabic gets a size step up
  // instead.
  const buttonLabel = isRtl ? 'text-base' : 'text-sm uppercase tracking-[0.14em]';
  const smallLabel = isRtl ? 'text-sm' : 'text-xs uppercase tracking-[0.24em]';
  const primaryButton = `btn-gold flex min-h-[52px] items-center justify-center rounded-full px-6 py-4 text-center font-semibold transition ${buttonLabel}`;
  const secondaryButton = `flex min-h-[52px] items-center justify-center rounded-full border border-white/20 px-6 py-4 text-center font-semibold text-white transition hover:border-white/40 ${buttonLabel}`;

  return (
    <PageShell locale={locale} copy={copy}>
      <section className="bg-spotlight-black px-4 pb-24 pt-28 sm:px-6 sm:pt-36 lg:px-8">
        <div className={`mx-auto max-w-xl ${isRtl ? 'text-right' : ''}`}>
          {/* The header's language switch is inside the menu on a phone. A guest
              whose phone language sent them to the wrong page needs it here. It
              keeps the same link, code and all. */}
          <div className="flex justify-end">
            <Link
              href={`/unlock/${encodeURIComponent(code ?? decoded ?? params.code)}`}
              locale={otherLocale}
              lang={otherLocale}
              className="inline-flex min-h-[44px] items-center rounded-full border border-white/15 px-4 text-sm text-white/75 transition hover:border-white/35 hover:text-white"
            >
              {t.otherLanguage}
            </Link>
          </div>

          <div
            className={`mt-4 font-serif text-[rgba(217,179,85,0.9)] ${
              isRtl ? 'text-sm' : 'text-xs uppercase tracking-[0.38em]'
            }`}
          >
            {t.eyebrow}
          </div>
          <h1 className="mt-5 font-serif text-4xl leading-tight text-white sm:text-5xl">
            {code ? t.title : t.incompleteTitle}
          </h1>
          <p className="mt-6 text-base leading-8 text-white/70">{code ? t.intro : t.incompleteIntro}</p>

          {code ? (
            <div className="mt-10 rounded-2xl border border-[rgba(217,179,85,0.28)] bg-white/[0.03] px-6 py-7 text-center">
              <div className={`text-white/40 ${smallLabel}`}>
                {t.codeLabel}
              </div>
              {/* Codes are Latin in both languages, so this stays LTR under RTL. */}
              <div dir="ltr" className="mt-3 font-mono text-3xl tracking-[0.12em] text-[#D9B355]">
                {code}
              </div>
            </div>
          ) : null}

          <div className="mt-8 space-y-5">
            {APP_STORE_URL ? (
              <div>
                <a href={APP_STORE_URL} className={primaryButton}>
                  {t.getTheApp}
                </a>
                <p className="mt-2 text-center text-xs leading-5 text-white/45">{t.getTheAppHint}</p>
              </div>
            ) : null}

            {/* Always here. Setting APP_STORE_URL adds the download above; it
                must never take this away, or Android guests are left with
                nothing on this page that works. */}
            <div>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={APP_STORE_URL ? secondaryButton : primaryButton}
              >
                {t.askUs}
              </a>
              {code ? (
                <p className="mt-2 text-center text-xs leading-5 text-white/45">
                  {APP_STORE_URL ? t.askUsHintWithApp : t.askUsHint}
                </p>
              ) : null}
            </div>
          </div>

          {code ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-white/75">{t.haveAppLead}</p>
                <a
                  href={appSchemeUnlockUrl(code)}
                  className={`inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-[rgba(217,179,85,0.45)] px-5 font-semibold text-[#D9B355] transition hover:border-[#D9B355] ${buttonLabel}`}
                >
                  {t.openInApp}
                </a>
              </div>
              <p className="mt-2 text-xs leading-5 text-white/45">{t.openInAppHint}</p>
            </div>
          ) : null}

          <div className="mt-12 border-t border-white/10 pt-6">
            <div className={`text-white/40 ${smallLabel}`}>
              {code ? t.manualTitle : t.manualTitleNoCode}
            </div>
            <p className="mt-3 text-sm leading-7 text-white/60">{code ? t.manualBody : t.manualBodyNoCode}</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
