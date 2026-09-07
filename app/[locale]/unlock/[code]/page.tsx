import type { Metadata } from 'next';
import { getSiteCopy } from '@/lib/site-content';
import { normalizeCode } from '@/lib/directory-taxonomy';
import { APP_STORE_URL, appSchemeUnlockUrl } from '@/lib/app-links';
import { type Locale } from '@/i18n/routing';
import { PageShell } from '@/components/page-shell';

/**
 * Where an unlock link lands when it does not open the app.
 *
 * With the app installed, iOS matches /unlock/* against the
 * apple-app-site-association file and this page is never seen. It is seen when
 * the app is missing, and also whenever a universal link is defeated by how the
 * URL was opened -- typed into Safari, or followed inside an in-app browser
 * that swallows the association. Both are common enough that "open in the app"
 * stays the first button rather than an afterthought.
 *
 * This page deliberately does NOT look the code up. /api/unlock returns a
 * byte-identical 404 for unknown and inactive codes so that guessing tells an
 * attacker nothing; a page that said "invalid code" in the browser would hand
 * back exactly the oracle that route is written to withhold.
 */

const WHATSAPP_NUMBER = '201066377883';

export const metadata: Metadata = {
  // Unlock links are private and sent one to one. They should never be indexed.
  robots: { index: false, follow: false }
};

export default function UnlockPage({
  params
}: {
  params: { locale: Locale; code: string };
}) {
  const { locale } = params;
  const copy = getSiteCopy(locale);
  const t = copy.unlockPage;
  const isRtl = locale === 'ar';

  // Same normalisation the app and /api/unlock apply, so a link that arrived
  // lower-cased or without dashes still shows the canonical code.
  const code = normalizeCode(decodeURIComponent(params.code));

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    t.whatsappMessage.replace('{code}', code)
  )}`;

  return (
    <PageShell locale={locale} copy={copy}>
      <section className="bg-spotlight-black px-4 pb-24 pt-32 sm:px-6 sm:pt-36 lg:px-8">
        <div className={`mx-auto max-w-xl ${isRtl ? 'text-right' : ''}`}>
          <div className="font-serif text-xs uppercase tracking-[0.38em] text-[rgba(217,179,85,0.9)]">
            {t.eyebrow}
          </div>
          <h1 className="mt-5 font-serif text-4xl leading-tight text-white sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-6 text-base leading-8 text-white/70">{t.intro}</p>

          <div className="mt-10 rounded-2xl border border-[rgba(217,179,85,0.28)] bg-white/[0.03] px-6 py-7 text-center">
            <div className="text-xs uppercase tracking-[0.24em] text-white/40">{t.codeLabel}</div>
            {/* Codes are Latin in both languages, so this stays LTR under RTL. */}
            <div dir="ltr" className="mt-3 font-mono text-3xl tracking-[0.12em] text-[#D9B355]">
              {code}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <a
                href={appSchemeUnlockUrl(code)}
                className="block rounded-full bg-[#D9B355] px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.14em] text-[#231F20] transition hover:bg-[#e5c470]"
              >
                {t.openInApp}
              </a>
              <p className="mt-2 text-center text-xs text-white/45">{t.openInAppHint}</p>
            </div>

            <div>
              <a
                href={APP_STORE_URL ?? whatsappHref}
                target={APP_STORE_URL ? undefined : '_blank'}
                rel={APP_STORE_URL ? undefined : 'noopener noreferrer'}
                className="block rounded-full border border-white/20 px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:border-white/40"
              >
                {APP_STORE_URL ? t.getTheApp : t.askUs}
              </a>
              <p className="mt-2 text-center text-xs text-white/45">
                {APP_STORE_URL ? t.getTheAppHint : t.askUsHint}
              </p>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6">
            <div className="text-xs uppercase tracking-[0.24em] text-white/40">{t.manualTitle}</div>
            <p className="mt-3 text-sm leading-7 text-white/60">{t.manualBody}</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
