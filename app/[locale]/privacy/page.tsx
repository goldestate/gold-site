import type { Metadata } from 'next';
import { getSiteCopy } from '@/lib/site-content';
import { getPrivacyCopy } from '@/lib/privacy-content';
import { type Locale } from '@/i18n/routing';
import { PageShell } from '@/components/page-shell';

export async function generateMetadata({
  params
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const privacy = getPrivacyCopy(params.locale);
  return {
    title: `${privacy.eyebrow} — ${getSiteCopy(params.locale).seo.title}`,
    description: privacy.intro
  };
}

/**
 * Apple requires a public privacy policy URL before an app can be submitted, so
 * this page has to be reachable without an account and stay reachable. It is in
 * the sitemap and deliberately not excluded in robots.ts.
 */
export default function PrivacyPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  const copy = getSiteCopy(locale);
  const privacy = getPrivacyCopy(locale);
  const isRtl = locale === 'ar';

  return (
    <PageShell locale={locale} copy={copy}>
      <section className="bg-spotlight-black px-4 pb-24 pt-32 sm:px-6 sm:pt-36 lg:px-8">
        <div className={`mx-auto max-w-2xl ${isRtl ? 'text-right' : ''}`}>
          <div className="font-serif text-xs uppercase tracking-[0.38em] text-[rgba(217,179,85,0.9)]">
            {privacy.eyebrow}
          </div>
          <h1 className="mt-5 font-serif text-3xl leading-tight text-white sm:text-4xl">
            {privacy.title}
          </h1>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/40">{privacy.updated}</p>
          <p className="mt-6 text-base leading-8 text-white/70">{privacy.intro}</p>

          <div className="mt-12 space-y-10">
            {privacy.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="font-serif text-xl text-white">{section.heading}</h2>

                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-4 text-[15px] leading-8 text-white/65">
                    {paragraph}
                  </p>
                ))}

                {section.bullets ? (
                  <ul className={`mt-4 space-y-2.5 ${isRtl ? 'pr-5' : 'pl-5'}`}>
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="list-disc text-[15px] leading-7 text-white/65 marker:text-[rgba(217,179,85,0.7)]"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
