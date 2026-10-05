'use client';

import { useRef, useState } from 'react';
import type { SiteCopy } from '@/lib/site-content';
import {
  NDA_GOLD_ALIAS,
  NDA_GOLD_PARTY,
  NDA_PARTIES_INTRO,
  NDA_PARTIES_OUTRO,
  NDA_SECTIONS,
  NDA_SIGNATURE_FIELDS,
  NDA_SIGNER_FIELDS,
  NDA_TITLE
} from '@/lib/nda';
import { Link } from '@/i18n/navigation';
import { GMark } from './gmark';
import { SectionTitle, SurfaceShell, ArrowIcon } from './section-ui';
import { SignaturePad, type SignaturePadHandle } from './signature-pad';

export type NdaPageState =
  | { kind: 'invalid' }
  | { kind: 'signed'; signedOn: string }
  | {
      kind: 'pending';
      signer: { name: string; company: string; phone: string; email: string };
      /** Today in Cairo, from the server, so the page and its hydration agree. */
      today: string;
      received: { kind: 'request'; referenceCode: string } | { kind: 'listing' } | null;
    };

const cardClass =
  'rounded-[1.5rem] bg-[#1B1718] p-6 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.7)] ring-1 ring-white/10 sm:p-9';
const eyebrowClass = 'font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]';

function DownIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" />
    </svg>
  );
}

/**
 * The confidentiality agreement's signing page: the step after "Request a unit"
 * and "List your property", and where the confirmation email's link leads.
 *
 * Signed right here. The agreement is set like the paper it replaces, with the
 * person's details already filled in, and they sign at the bottom of it with a
 * finger, a mouse or a pen. Nothing to download, print or upload.
 */
export function NdaSignSection({
  copy,
  isRtl,
  token,
  state
}: {
  copy: SiteCopy['ndaPage'];
  isRtl: boolean;
  token: string;
  state: NdaPageState;
}) {
  const padRef = useRef<SignaturePadHandle>(null);
  const [started, setStarted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<'done' | 'already' | 'invalid' | null>(null);

  // The page's own language, for the few controls that sit inside the English text.
  const uiLanguage = { dir: isRtl ? 'rtl' : 'ltr', lang: isRtl ? 'ar' : 'en' } as const;

  const clear = () => {
    padRef.current?.clear();
    setStarted(false);
  };

  const submit = async () => {
    setError('');
    if (!padRef.current || padRef.current.isEmpty()) {
      setError(copy.errorDraw);
      return;
    }
    if (!agreed) {
      setError(copy.errorAgree);
      return;
    }
    const signature = await padRef.current.toBlob();
    if (!signature) {
      setError(copy.errorGeneric);
      return;
    }

    setBusy(true);
    const form = new FormData();
    form.append('method', 'drawn');
    form.append('agree', 'yes');
    form.append('file', signature, 'signature.png');
    try {
      const response = await fetch(`/api/nda/${encodeURIComponent(token)}`, { method: 'POST', body: form });
      if (response.ok) setOutcome('done');
      else if (response.status === 409) setOutcome('already');
      else if (response.status === 404) setOutcome('invalid');
      else setError(copy.errorGeneric);
    } catch {
      setError(copy.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const message = (title: string, body: string) => (
    <div className={`${cardClass} py-10 text-center`}>
      <div className={eyebrowClass}>{title}</div>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/[0.74]">{body}</p>
      <div className="mt-8">
        <Link
          href="/"
          className="btn-gold inline-flex h-12 items-center gap-3 rounded-full px-8 text-sm font-medium uppercase tracking-[0.2em]"
        >
          {copy.backHome}
          <ArrowIcon rtl={isRtl} />
        </Link>
      </div>
    </div>
  );

  let content: React.ReactNode;
  if (outcome === 'done') {
    content = message(copy.doneTitle, copy.doneBody);
  } else if (outcome === 'already') {
    content = message(copy.signedTitle, copy.signedBody.replace('{date}', '—'));
  } else if (outcome === 'invalid' || state.kind === 'invalid') {
    content = message(copy.invalidTitle, copy.invalidBody);
  } else if (state.kind === 'signed') {
    content = message(copy.signedTitle, copy.signedBody.replace('{date}', state.signedOn));
  } else {
    const { signer, received, today } = state;
    const signatureValue = (field: (typeof NDA_SIGNATURE_FIELDS)[number]) =>
      field === 'Name' ? signer.name : field === 'Company (Optional)' ? signer.company || '—' : today;

    content = (
      <div className="space-y-6">
        {received ? (
          <div className="rounded-[1.25rem] border border-[rgba(217,179,85,0.35)] bg-[rgba(217,179,85,0.08)] px-5 py-4 text-sm text-white/85">
            {received.kind === 'request'
              ? copy.receivedRequest.replace('{reference}', received.referenceCode)
              : copy.receivedListing}
          </div>
        ) : null}

        <div>
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div>
              <div className={eyebrowClass}>{copy.agreementTitle}</div>
              {copy.agreementLanguageNote ? (
                <p className="mt-2 text-xs text-white/50">{copy.agreementLanguageNote}</p>
              ) : null}
            </div>
            <a
              href="#sign"
              className="inline-flex min-h-[40px] items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#D9B355] transition hover:text-[#F1D878]"
            >
              {copy.jumpToSign}
              <DownIcon />
            </a>
          </div>

          {/* English on every page: it is the text being signed. */}
          <article
            dir="ltr"
            lang="en"
            aria-label={NDA_TITLE}
            className="mt-4 rounded-[1.25rem] bg-[#FBFAF6] px-5 py-8 text-left text-[0.9375rem] leading-7 text-[rgba(35,31,32,0.84)] shadow-[0_30px_70px_-35px_rgba(0,0,0,0.85)] sm:px-10 sm:py-12"
          >
            <h3 className="font-serif text-lg leading-snug text-[#231F20] sm:text-xl">{NDA_TITLE}</h3>
            <p className="mt-6">{NDA_PARTIES_INTRO}</p>
            <p className="mt-3 font-medium text-[#231F20]">{NDA_GOLD_PARTY}</p>
            <p>{NDA_GOLD_ALIAS}</p>
            <p className="mt-3">and</p>
            <dl className="mt-3 space-y-1">
              {NDA_SIGNER_FIELDS.map((field) => (
                <div key={field.key} className="flex flex-wrap gap-x-2">
                  <dt>{field.label}:</dt>
                  <dd className="min-w-0 font-medium text-[#231F20] [overflow-wrap:anywhere]" dir="auto">
                    {signer[field.key] || '—'}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3">{NDA_PARTIES_OUTRO}</p>

            {NDA_SECTIONS.map((section) => (
              <section key={section.heading} className="mt-7">
                <h4 className="font-semibold text-[#231F20]">{section.heading}</h4>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-2">
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-[#B8860B]">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
                {section.after?.map((paragraph) => (
                  <p key={paragraph} className="mt-2">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}

            {/* The signature block, signed in place. */}
            <section id="sign" className="mt-10 scroll-mt-28 border-t border-[rgba(35,31,32,0.14)] pt-8">
              <p className="font-semibold text-[#231F20]">Broker / Sales Partner / Client</p>
              <dl className="mt-3 space-y-1">
                {NDA_SIGNATURE_FIELDS.map((field) =>
                  field === 'Signature' ? (
                    <div key={field} className="pb-2 pt-3">
                      <dt>{field}:</dt>
                      <dd className="mt-2">
                        <div
                          className="relative rounded-[0.9rem] ring-1 ring-[rgba(35,31,32,0.16)]"
                          onPointerDown={() => {
                            setStarted(true);
                            setError('');
                          }}
                        >
                          <SignaturePad ref={padRef} label={copy.drawHint} />
                          {/* The line to sign on sits over the pad, so it never ends up in the signature. */}
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-5 bottom-10 flex items-end gap-3 border-b border-[rgba(35,31,32,0.3)] pb-1.5"
                          >
                            <span className="text-lg leading-none text-[#8B6508]">×</span>
                            {started ? null : (
                              <span {...uiLanguage} className="text-sm leading-none text-[rgba(35,31,32,0.4)]">
                                {copy.signHere}
                              </span>
                            )}
                          </div>
                        </div>
                        <div {...uiLanguage} className="mt-2 flex items-center justify-between gap-3">
                          <span className="text-xs leading-5 text-[rgba(35,31,32,0.55)]">{copy.drawHint}</span>
                          <button
                            type="button"
                            onClick={clear}
                            disabled={!started}
                            className="min-h-[40px] flex-none rounded-full px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#8B6508] transition hover:text-[#231F20] disabled:opacity-40"
                          >
                            {copy.clear}
                          </button>
                        </div>
                      </dd>
                    </div>
                  ) : (
                    <div key={field} className="flex flex-wrap gap-x-2">
                      <dt>{field}:</dt>
                      <dd className="font-medium text-[#231F20]" dir="auto">
                        {signatureValue(field)}
                      </dd>
                    </div>
                  )
                )}
              </dl>
              <p className="mt-8 font-medium text-[#231F20]">{NDA_GOLD_PARTY}.</p>
            </section>
          </article>
        </div>

        <div className="pt-2">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-white/80">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => {
                setAgreed(event.target.checked);
                setError('');
              }}
              className="mt-0.5 h-5 w-5 flex-none accent-[#D9B355]"
            />
            <span>{copy.agreeLabel}</span>
          </label>

          {error ? (
            <p role="alert" className="mt-4 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="btn-gold mt-6 inline-flex h-12 w-full items-center justify-center gap-3 rounded-full px-8 text-sm font-medium uppercase tracking-[0.2em] disabled:opacity-60 sm:w-auto"
          >
            {busy ? copy.submitting : copy.submit}
            <ArrowIcon rtl={isRtl} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <SurfaceShell variant="spotlight" className="px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:px-8">
      <GMark tone="gold" size={560} className={`-bottom-24 opacity-[0.05] ${isRtl ? '-right-24' : '-left-24'}`} />
      <div className="relative mx-auto max-w-3xl">
        <SectionTitle eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} isRtl={isRtl} />
        <div className="mt-12">{content}</div>
      </div>
    </SurfaceShell>
  );
}
