'use client';

import { useEffect, useRef, useState } from 'react';
import type { SiteCopy } from '@/lib/site-content';
import {
  NDA_GOLD_ALIAS,
  NDA_GOLD_PARTY,
  NDA_PARTIES_INTRO,
  NDA_PARTIES_OUTRO,
  NDA_PDF_PATH,
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

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const cardClass =
  'rounded-[1.5rem] bg-[#1B1718] p-6 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.7)] ring-1 ring-white/10 sm:p-9';
const eyebrowClass = 'font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]';

/**
 * The confidentiality agreement's signing page: the step after "Request a unit"
 * and "List your property", and where the confirmation email's link leads.
 *
 * Two ways to sign, because both happen: on screen with a finger (most people,
 * on a phone), or the old way -- download the PDF, sign it, photograph it,
 * upload it. Either way the result goes to GOLD with the details from the form.
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
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [hasInk, setHasInk] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<'done' | 'already' | 'invalid' | null>(null);

  // A photo shows as a thumbnail; the object URL is released when replaced.
  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const chooseFile = (chosen: File | null) => {
    setError('');
    if (!chosen) return;
    const typeOk = chosen.type.startsWith('image/') || chosen.type === 'application/pdf';
    if (!typeOk || chosen.size > MAX_FILE_BYTES) {
      setFile(null);
      setError(copy.errorFileType);
      return;
    }
    setFile(chosen);
  };

  const submit = async () => {
    setError('');
    let body: Blob | null = null;
    let name = 'signature.png';
    if (mode === 'draw') {
      if (!padRef.current || padRef.current.isEmpty()) {
        setError(copy.errorDraw);
        return;
      }
      body = await padRef.current.toBlob();
    } else {
      if (!file) {
        setError(copy.errorFile);
        return;
      }
      body = file;
      name = file.name || 'signed-agreement';
    }
    if (!agreed) {
      setError(copy.errorAgree);
      return;
    }
    if (!body) {
      setError(copy.errorGeneric);
      return;
    }

    setBusy(true);
    const form = new FormData();
    form.append('method', mode === 'draw' ? 'drawn' : 'uploaded');
    form.append('agree', 'yes');
    form.append('file', body, name);
    try {
      const response = await fetch(`/api/nda/${encodeURIComponent(token)}`, { method: 'POST', body: form });
      if (response.ok) setOutcome('done');
      else if (response.status === 409) setOutcome('already');
      else if (response.status === 404) setOutcome('invalid');
      else if (response.status === 400) setError(mode === 'upload' ? copy.errorFileType : copy.errorGeneric);
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
    const details: { label: string; value: string }[] = [
      { label: copy.nameLabel, value: signer.name },
      { label: copy.companyLabel, value: signer.company },
      { label: copy.phoneLabel, value: signer.phone },
      { label: copy.emailLabel, value: signer.email }
    ].filter((item) => item.value);

    content = (
      <div className="space-y-6">
        {received ? (
          <div className="rounded-[1.25rem] border border-[rgba(217,179,85,0.35)] bg-[rgba(217,179,85,0.08)] px-5 py-4 text-sm text-white/85">
            {received.kind === 'request'
              ? copy.receivedRequest.replace('{reference}', received.referenceCode)
              : copy.receivedListing}
          </div>
        ) : null}

        {details.length > 0 ? (
          <div className={cardClass}>
            <div className={eyebrowClass}>{copy.detailsTitle}</div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {details.map((item) => (
                <div key={item.label}>
                  <dt className="text-xs uppercase tracking-[0.18em] text-white/45">{item.label}</dt>
                  <dd className="mt-1 break-words text-sm text-white" dir="auto">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        <div className={cardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={eyebrowClass}>{copy.agreementTitle}</div>
            <a
              href={NDA_PDF_PATH}
              download="GOLD-NDA.pdf"
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[rgba(217,179,85,0.45)] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#D9B355] transition hover:border-[#D9B355]"
            >
              {copy.download}
            </a>
          </div>
          {copy.agreementLanguageNote ? (
            <p className="mt-3 text-xs text-white/50">{copy.agreementLanguageNote}</p>
          ) : null}
          {/* English on every page: it is the text being signed. */}
          <div
            dir="ltr"
            lang="en"
            tabIndex={0}
            aria-label={NDA_TITLE}
            className="mt-5 max-h-[26rem] overflow-y-auto rounded-[1.25rem] border border-white/10 bg-black/25 p-5 text-left text-sm leading-7 text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D9B355] sm:p-6"
          >
            <h3 className="text-base font-medium uppercase tracking-[0.12em] text-white">{NDA_TITLE}</h3>
            <p className="mt-4">{NDA_PARTIES_INTRO}</p>
            <p className="mt-3 text-white">{NDA_GOLD_PARTY}</p>
            <p>{NDA_GOLD_ALIAS}</p>
            <p className="mt-3">and</p>
            <dl className="mt-3 space-y-1">
              {NDA_SIGNER_FIELDS.map((field) => (
                <div key={field.key} className="flex flex-wrap gap-x-2">
                  <dt>{field.label}:</dt>
                  <dd className="text-white" dir="auto">
                    {signer[field.key] || '—'}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3">{NDA_PARTIES_OUTRO}</p>
            {NDA_SECTIONS.map((section) => (
              <section key={section.heading} className="mt-6">
                <h4 className="font-medium text-white">{section.heading}</h4>
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
            <p className="mt-6 text-white">Broker / Sales Partner / Client</p>
            <dl className="mt-2 space-y-1">
              {NDA_SIGNATURE_FIELDS.map((field) => (
                <div key={field} className="flex flex-wrap gap-x-2">
                  <dt>{field}:</dt>
                  <dd className="text-white" dir="auto">
                    {field === 'Name' ? signer.name : field === 'Company (Optional)' ? signer.company || '—' : field === 'Date' ? today : '(below)'}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-white">{NDA_GOLD_PARTY}.</p>
          </div>
        </div>

        <div className={cardClass}>
          <div className={eyebrowClass}>{copy.signTitle}</div>

          <div role="tablist" aria-label={copy.signTitle} className="mt-5 grid grid-cols-2 gap-2">
            {(
              [
                ['draw', copy.drawTab],
                ['upload', copy.uploadTab]
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => {
                  setMode(value);
                  setError('');
                }}
                className={`min-h-[44px] rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  mode === value
                    ? 'border-[#D9B355] bg-[rgba(217,179,85,0.14)] text-[#D9B355]'
                    : 'border-white/15 text-white/60 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'draw' ? (
            <div className="mt-5">
              <p className="mb-3 text-sm text-white/60">{copy.drawHint}</p>
              <SignaturePad ref={padRef} label={copy.drawHint} onInk={setHasInk} />
              <div className={`mt-3 flex ${isRtl ? 'justify-start' : 'justify-end'}`}>
                <button
                  type="button"
                  onClick={() => padRef.current?.clear()}
                  disabled={!hasInk}
                  className="min-h-[40px] rounded-full border border-white/15 px-4 text-xs uppercase tracking-[0.16em] text-white/70 transition hover:text-white disabled:opacity-40"
                >
                  {copy.clear}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <p className="mb-3 text-sm text-white/60">{copy.uploadHint}</p>
              <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-dashed border-white/20 bg-white/[0.03] p-5 text-center transition hover:border-[#D9B355]">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="max-h-56 rounded-[0.75rem] object-contain" />
                ) : file ? (
                  <span className="break-all text-sm text-white">{file.name}</span>
                ) : null}
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D9B355]">
                  {file ? copy.replaceFile : copy.chooseFile}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="sr-only"
                  onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          )}

          <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => {
                setAgreed(event.target.checked);
                setError('');
              }}
              className="mt-1 h-5 w-5 flex-none accent-[#D9B355]"
            />
            <span>{copy.agreeLabel}</span>
          </label>

          {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

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
