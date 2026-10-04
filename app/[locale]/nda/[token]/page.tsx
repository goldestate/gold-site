import type { Metadata } from 'next';
import { getSiteCopy } from '@/lib/site-content';
import { type Locale } from '@/i18n/routing';
import { PageShell } from '@/components/page-shell';
import { NdaSignSection, type NdaPageState } from '@/components/nda-sign-section';
import { getNdaByToken, readNdaSubject } from '@/lib/nda-store';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const copy = getSiteCopy(params.locale);
  return {
    title: `${copy.ndaPage.title} — ${copy.seo.title}`,
    // A personal page behind a secret link: never indexed, and the link is not
    // passed on to any site this page links to.
    robots: { index: false, follow: false },
    referrer: 'no-referrer'
  };
}

function cairoDate(value: Date, locale: Locale): string {
  return value.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    timeZone: 'Africa/Cairo',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export default async function NdaPage({ params }: { params: { locale: Locale; token: string } }) {
  const { locale, token } = params;
  const copy = getSiteCopy(locale);

  let state: NdaPageState = { kind: 'invalid' };
  try {
    const nda = await getNdaByToken(token);
    if (nda?.status === 'signed') {
      state = { kind: 'signed', signedOn: nda.signedAt ? cairoDate(new Date(nda.signedAt), locale) : '—' };
    } else if (nda) {
      state = {
        kind: 'pending',
        signer: nda.signer,
        received: await readNdaSubject(nda),
        // The agreement's own date line is English, like the rest of its text.
        today: cairoDate(new Date(), 'en')
      };
    }
  } catch (error) {
    // Before migration 007 the table isn't there; the link then reads as invalid.
    console.error('Could not load the agreement', error);
  }

  return (
    <PageShell locale={locale} copy={copy}>
      <NdaSignSection copy={copy.ndaPage} isRtl={locale === 'ar'} token={token} state={state} />
    </PageShell>
  );
}
