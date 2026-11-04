'use client';

import { useRef, useState } from 'react';
import type { SiteCopy } from '@/lib/site-content';
import {
  NDA_GOLD_ALIAS,
  NDA_GOLD_PARTY,
  NDA_PARTIES_INTRO,
  NDA_PARTIES_OUTRO,
  NDA_SECTIONS,
  NDA_TEMPLATE,
  NDA_TITLE,
  type NdaBlankKey
} from '@/lib/nda';
import { cleanPhone } from '@/lib/phone';
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

type Details = { name: string; company: string; phone: string; email: string };
type Field = 'name' | 'phone' | 'email';

const cardClass =
  'rounded-[1.5rem] bg-[#1B1718] p-6 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.7)] ring-1 ring-white/10 sm:p-9';
const eyebrowClass = 'font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]';
const inputClass =
  'mt-2 block h-12 w-full rounded-[0.9rem] border bg-white/[0.06] px-4 text-base text-white outline-none transition placeholder:text-white/30 focus:bg-white/[0.09]';

/** A position on a page, as a share of its width or height, so it scales with the picture. */
const share = (points: number, of: number) => `${(points / of) * 100}%`;

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

/** A detail written on its blank in the page picture, where the PDF will have it. */
function OnBlank({ blank, value }: { blank: NdaBlankKey; value: string }) {
  if (!value.trim()) return null;
  const { x, lineY } = NDA_TEMPLATE.blanks[blank];
  const { width, height, fontSize, lineEnd } = NDA_TEMPLATE;
  return (
    <span
      dir="auto"
      className="pointer-events-none absolute overflow-hidden text-ellipsis whitespace-nowrap text-left leading-none text-[#231F20]"
      style={{
        left: share(x + 4, width),
        width: share(lineEnd - x - 8, width),
        top: share(lineY - 4.5 - fontSize * 0.82, height),
        fontSize: `${(fontSize / width) * 100}cqw`
      }}
    >
      {value}
    </span>
  );
}

/**
 * GOLD's agreement, page by page, as the PDF it is. What the person types and
 * draws below shows up on its blanks as they go: the signed PDF is made from
 * exactly these values, in exactly these places.
 */
function AgreementPages({
  details,
  signature,
  today,
  pageAlt
}: {
  details: Details;
  signature: string | null;
  today: string;
  pageAlt: string;
}) {
  const { pageImages, pageImageSize, width, height, signature: box } = NDA_TEMPLATE;
  const onPage: Record<number, [NdaBlankKey, string][]> = {
    0: [
      ['partyName', details.name],
      ['partyCompany', details.company],
      ['partyPhone', details.phone],
      ['partyEmail', details.email]
    ],
    2: [
      ['signName', details.name],
      ['signCompany', details.company],
      ['signDate', today]
    ]
  };

  return (
    <div className="space-y-4" dir="ltr">
      {pageImages.map((src, index) => (
        <div
          key={src}
          className="relative overflow-hidden rounded-[0.75rem] bg-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.85)] [container-type:inline-size]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={pageAlt.replace('{page}', String(index + 1)).replace('{pages}', String(pageImages.length))}
            width={pageImageSize.width}
            height={pageImageSize.height}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            className="block h-auto w-full select-none"
          />
          {onPage[index]?.map(([blank, value]) => <OnBlank key={blank} blank={blank} value={value} />)}
          {index === box.page ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute"
              style={{
                left: share(box.x, width),
                top: share(box.top, height),
                width: share(box.width, width),
                height: share(box.height, height)
              }}
            >
              {signature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={signature} alt="" className="h-full w-full object-contain object-left mix-blend-multiply" />
              ) : (
                <div className="h-full w-1/2 rounded-[2px] bg-[rgba(217,179,85,0.22)] ring-1 ring-[rgba(184,134,11,0.55)]" />
              )}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * The confidentiality agreement's signing page: the step after "Request a unit"
 * and "List your property", and where the confirmation email's link leads.
 *
 * Made for a phone. The agreement shows as the PDF it is; below it, plain text
 * boxes for the details and a signature box big enough for a finger. Sending
 * signs that PDF: GOLD keeps it with the details and signature on it.
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
  const fieldRefs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});
  const [details, setDetails] = useState<Details>(() =>
    state.kind === 'pending' ? { ...state.signer } : { name: '', company: '', phone: '', email: '' }
  );
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [signature, setSignature] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<'done' | 'already' | 'invalid' | null>(null);

  const update = (key: keyof Details, value: string) => {
    setDetails((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setError('');
  };

  const check = (): Partial<Record<Field, string>> => {
    const found: Partial<Record<Field, string>> = {};
    if (details.name.trim().length < 2) found.name = copy.errorName;
    const digits = cleanPhone(details.phone).replace(/^\+/, '');
    if (digits.length < 7 || digits.length > 15) found.phone = copy.errorPhone;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) found.email = copy.errorEmail;
    return found;
  };

  const clear = () => {
    padRef.current?.clear();
    setStarted(false);
    setSignature(null);
  };

  const submit = async () => {
    setError('');
    const found = check();
    setFieldErrors(found);
    const firstInvalid = (['name', 'phone', 'email'] as const).find((field) => found[field]);
    if (firstInvalid) {
      setError(copy.errorFields);
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }
    if (!padRef.current || padRef.current.isEmpty()) {
      setError(copy.errorDraw);
      return;
    }
    if (!agreed) {
      setError(copy.errorAgree);
      return;
    }
    const drawn = await padRef.current.toBlob();
    if (!drawn) {
      setError(copy.errorGeneric);
      return;
    }

    setBusy(true);
    const form = new FormData();
    form.append('method', 'drawn');
    form.append('agree', 'yes');
    form.append('file', drawn, 'signature.png');
    form.append('name', details.name);
    form.append('company', details.company);
    form.append('phone', details.phone);
    form.append('email', details.email);
    try {
      const response = await fetch(`/api/nda/${encodeURIComponent(token)}`, { method: 'POST', body: form });
      if (response.ok) setOutcome('done');
      else if (response.status === 409) setOutcome('already');
      else if (response.status === 404) setOutcome('invalid');
      else {
        const body = (await response.json().catch(() => null)) as { field?: Field } | null;
        const field = body?.field;
        if (field === 'name' || field === 'phone' || field === 'email') {
          const message = { name: copy.errorName, phone: copy.errorPhone, email: copy.errorEmail }[field];
          setFieldErrors({ [field]: message });
          setError(copy.errorFields);
          fieldRefs.current[field]?.focus();
        } else {
          setError(copy.errorGeneric);
        }
      }
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
    const { received, today } = state;
    const textField = (
      field: keyof Details,
      label: string,
      input: React.InputHTMLAttributes<HTMLInputElement>
    ) => {
      const problem = field === 'company' ? undefined : fieldErrors[field];
      return (
        <label className="block">
          <span className="text-sm text-white/75">{label}</span>
          <input
            ref={(element) => {
              if (field !== 'company') fieldRefs.current[field] = element;
            }}
            value={details[field]}
            onChange={(event) => update(field, event.target.value)}
            aria-invalid={problem ? true : undefined}
            className={`${inputClass} ${problem ? 'border-red-400/70' : 'border-white/15 focus:border-[#D9B355]'}`}
            {...input}
          />
          {problem ? <span className="mt-1.5 block text-sm text-red-300">{problem}</span> : null}
        </label>
      );
    };

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

          <div className="mt-4">
            <AgreementPages details={details} signature={signature} today={today} pageAlt={copy.pageAlt} />
          </div>

          <details className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-5 py-4">
            <summary className="min-h-[32px] cursor-pointer select-none text-xs font-semibold uppercase tracking-[0.16em] text-[#D9B355]">
              {copy.readAsText}
            </summary>
            {/* English on every page: it is the text being signed. */}
            <div dir="ltr" lang="en" className="mt-4 text-left text-sm leading-7 text-white/75">
              <p className="font-medium uppercase tracking-[0.1em] text-white">{NDA_TITLE}</p>
              <p className="mt-3">
                {NDA_PARTIES_INTRO} {NDA_GOLD_PARTY} ({NDA_GOLD_ALIAS}) and the Broker / Sales Partner / Client named in
                it. {NDA_PARTIES_OUTRO}
              </p>
              {NDA_SECTIONS.map((section) => (
                <section key={section.heading} className="mt-5">
                  <h3 className="font-medium text-white">{section.heading}</h3>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-2">
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5">
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
            </div>
          </details>
        </div>

        <section
          id="sign"
          aria-label={copy.fillTitle}
          className="scroll-mt-28 rounded-[1.5rem] bg-[#1B1718] p-5 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.7)] ring-1 ring-white/10 sm:p-9"
        >
          <div className={eyebrowClass}>{copy.fillTitle}</div>
          <p className="mt-3 text-sm leading-6 text-white/60">{copy.fillIntro}</p>

          <div className="mt-6 space-y-5">
            {textField('name', copy.nameLabel, { autoComplete: 'name', dir: 'auto', maxLength: 100 })}
            {textField('company', copy.companyLabel, { autoComplete: 'organization', dir: 'auto', maxLength: 100 })}
            {textField('phone', copy.phoneLabel, {
              type: 'tel',
              inputMode: 'tel',
              autoComplete: 'tel',
              dir: 'ltr',
              maxLength: 30
            })}
            {textField('email', copy.emailLabel, {
              type: 'email',
              inputMode: 'email',
              autoComplete: 'email',
              autoCapitalize: 'none',
              spellCheck: false,
              dir: 'ltr',
              maxLength: 254
            })}
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-white/75">{copy.signatureLabel}</span>
              <button
                type="button"
                onClick={clear}
                disabled={!started}
                className="min-h-[40px] rounded-full px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#D9B355] transition hover:text-[#F1D878] disabled:opacity-30"
              >
                {copy.clear}
              </button>
            </div>
            <div
              className="relative mt-2"
              onPointerDown={() => {
                setStarted(true);
                setError('');
              }}
            >
              <SignaturePad
                ref={padRef}
                label={copy.drawHint}
                className="h-64 sm:h-72"
                onInk={() => setSignature(padRef.current?.toDataUrl() ?? null)}
              />
              {/* The line to sign on sits over the box, so it never ends up in the signature. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 bottom-14 flex items-end gap-3 border-b border-[rgba(35,31,32,0.28)] pb-2"
              >
                <span className="text-xl leading-none text-[#8B6508]">×</span>
                {started ? null : <span className="text-base leading-none text-[rgba(35,31,32,0.38)]">{copy.signHere}</span>}
              </div>
            </div>
            <p className="mt-2 text-xs leading-5 text-white/50">{copy.drawHint}</p>
          </div>

          <p className="mt-6 text-sm text-white/70">
            {copy.dateLabel}:{' '}
            <span dir="ltr" className="text-white">
              {today}
            </span>
          </p>

          <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm leading-6 text-white/80">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => {
                setAgreed(event.target.checked);
                setError('');
              }}
              className="mt-0.5 h-6 w-6 flex-none accent-[#D9B355]"
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
            className="btn-gold mt-6 inline-flex h-14 w-full items-center justify-center gap-3 rounded-full px-8 text-sm font-medium uppercase tracking-[0.2em] disabled:opacity-60 sm:h-12 sm:w-auto"
          >
            {busy ? copy.submitting : copy.submit}
            <ArrowIcon rtl={isRtl} />
          </button>
        </section>
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
