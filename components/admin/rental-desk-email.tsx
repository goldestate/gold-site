'use client';

import { useEffect, useRef, useState } from 'react';
import { adminFetch } from '@/lib/admin-fetch';
import { isEmailShaped } from '@/lib/email-address';
import {
  FOLLOW_UP_CHOICES,
  FOLLOW_UP_MAX_RECIPIENTS,
  FOLLOW_UP_MESSAGE_MAX,
  FOLLOW_UP_SUBJECT_MAX,
  customText,
  messageLanguage,
  templateText,
  type FollowUpAudience,
  type FollowUpSubject,
  type FollowUpTemplate
} from '@/lib/follow-up-emails';

/** One ticked row: the person, and the listing or request the message is about. */
export type EmailRecipient = FollowUpSubject & { id: string; email: string | null };

type Person = { id: string; name: string };
type SendResult = { sent: Person[]; noEmail: Person[]; failed: Person[]; notFound: number };

const fieldClass =
  'w-full rounded-[0.8rem] border border-white/12 bg-white/5 px-3 py-2.5 text-base text-white outline-none placeholder:text-white/30 focus:border-[#D9B355]';

const labelClass = 'block space-y-1 text-[11px] uppercase tracking-[0.16em] text-white/40';

const DEFAULT_SUBJECT = { en: 'A message from GOLD', ar: 'رسالة من جولد' } as const;

const NOUNS: Record<FollowUpAudience, [string, string]> = {
  owners: ['owner', 'owners'],
  brokers: ['broker', 'brokers']
};

function people(count: number, audience: FollowUpAudience): string {
  return `${count} ${NOUNS[audience][count === 1 ? 0 : 1]}`;
}

/**
 * The bar that appears while people are ticked, stuck to the bottom of the
 * screen, and the panel it opens to email them.
 */
export function RentalDeskEmailBar({
  audience,
  recipients,
  onClear,
  onKeepOnly
}: {
  audience: FollowUpAudience;
  recipients: EmailRecipient[];
  onClear: () => void;
  /** After a send: leave only these ticked (the ones that failed), so staff can try them again. */
  onKeepOnly: (ids: string[]) => void;
}) {
  // What the panel sends to is fixed when it opens, whatever the list does meanwhile.
  const [open, setOpen] = useState<EmailRecipient[] | null>(null);
  const withoutEmail = recipients.filter((recipient) => !isEmailShaped(recipient.email)).length;

  return (
    <>
      {recipients.length > 0 ? (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-[rgba(217,179,85,0.35)] bg-[#231F20]/95 px-5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur">
          <span className="text-sm text-white">
            {recipients.length} selected
            {withoutEmail > 0 ? <span className="text-white/50"> · {withoutEmail} without email</span> : null}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(recipients)}
              className="btn-gold min-h-[40px] rounded-full px-5 text-xs font-semibold uppercase tracking-[0.14em]"
            >
              Email them
            </button>
            <button
              type="button"
              onClick={onClear}
              className="min-h-[40px] rounded-full border border-white/15 px-4 text-xs uppercase tracking-[0.14em] text-white/60 transition hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}

      {open ? (
        <EmailPanel
          audience={audience}
          recipients={open}
          onClose={(result) => {
            setOpen(null);
            if (result) onKeepOnly(result.failed.map((person) => person.id));
          }}
        />
      ) : null}
    </>
  );
}

function EmailPanel({
  audience,
  recipients,
  onClose
}: {
  audience: FollowUpAudience;
  recipients: EmailRecipient[];
  /** With the result when something was sent; null when closed without sending. */
  onClose: (result: SendResult | null) => void;
}) {
  const choices = FOLLOW_UP_CHOICES[audience];
  const [template, setTemplate] = useState<FollowUpTemplate>(choices[0].value);
  // The subject follows the message's language until staff change it themselves.
  const [subjectDraft, setSubjectDraft] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const subject = subjectDraft ?? DEFAULT_SUBJECT[messageLanguage(message)];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SendResult | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const reachable = recipients.filter((recipient) => isEmailShaped(recipient.email));
  const sample = reachable[0] ?? recipients[0];
  const preview =
    template === 'custom'
      ? customText(sample.name, subject, message.trim() ? message : '…')
      : templateText(audience, template, sample);
  const tooMany = recipients.length > FOLLOW_UP_MAX_RECIPIENTS;
  const written = template !== 'custom' || (subject.trim().length > 0 && message.trim().length > 0);
  const canSend = !busy && reachable.length > 0 && !tooMany && written;

  const close = () => {
    if (!busy) onClose(result);
  };

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose(result);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, result, onClose]);

  const send = async () => {
    setBusy(true);
    setError('');
    const response = await adminFetch<SendResult>('/api/rental-desk/email', {
      method: 'POST',
      body: { audience, template, ids: recipients.map((recipient) => recipient.id), subject, message }
    });
    setBusy(false);
    if (!response.ok) {
      setError(response.error);
      return;
    }
    setResult(response.data);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rental-desk-email-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[1.5rem] border border-white/10 bg-[#231F20] p-6 outline-none sm:rounded-[1.5rem]"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="rental-desk-email-title" className="text-lg font-medium uppercase tracking-[0.12em] text-white">
            Email {people(recipients.length, audience)}
          </h2>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Close"
            className="min-h-[36px] rounded-full border border-white/15 px-3 text-sm text-white/60 transition hover:text-white disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        {result ? (
          <div className="mt-5 space-y-3 text-sm leading-relaxed">
            {result.sent.length > 0 ? (
              <p className="text-[#7ED9A0]">
                Sent to {result.sent.length}: {result.sent.map((person) => person.name).join(', ')}.
              </p>
            ) : null}
            {result.noEmail.length > 0 ? (
              <p className="text-white/60">
                Not sent, no email on file: {result.noEmail.map((person) => person.name).join(', ')}.
              </p>
            ) : null}
            {result.failed.length > 0 ? (
              <p className="text-red-300">
                Didn&rsquo;t go through: {result.failed.map((person) => person.name).join(', ')}. They stay ticked: try
                again in a minute.
              </p>
            ) : null}
            {result.notFound > 0 ? (
              <p className="text-white/60">
                {result.notFound} {result.notFound === 1 ? 'was' : 'were'} deleted before sending.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => onClose(result)}
              className="btn-gold mt-2 min-h-[44px] rounded-full px-6 text-xs font-semibold uppercase tracking-[0.16em]"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <fieldset className="mt-5">
              <legend className={labelClass}>Message</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {choices.map((choice) => (
                  <button
                    key={choice.value}
                    type="button"
                    aria-pressed={template === choice.value}
                    onClick={() => setTemplate(choice.value)}
                    disabled={busy}
                    className={`min-h-[40px] rounded-full border px-4 text-xs uppercase tracking-[0.14em] transition ${
                      template === choice.value
                        ? 'border-[#D9B355] bg-[rgba(217,179,85,0.15)] text-[#D9B355]'
                        : 'border-white/15 text-white/60 hover:text-white'
                    }`}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {template === 'custom' ? (
              <div className="mt-5 space-y-4">
                <label className={labelClass}>
                  <span>Subject</span>
                  <input
                    value={subject}
                    onChange={(event) => setSubjectDraft(event.target.value)}
                    maxLength={FOLLOW_UP_SUBJECT_MAX}
                    disabled={busy}
                    dir="auto"
                    className={fieldClass}
                  />
                </label>
                <label className={labelClass}>
                  <span>Message</span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={FOLLOW_UP_MESSAGE_MAX}
                    rows={6}
                    disabled={busy}
                    dir="auto"
                    placeholder="English or Arabic. Each line becomes a paragraph."
                    className={fieldClass}
                  />
                </label>
              </div>
            ) : null}

            <div className="mt-6">
              <div className={labelClass}>Preview</div>
              <div className="mt-2 rounded-[1rem] border border-white/10 bg-black/25 p-4">
                <div className="text-sm font-medium text-white" dir="auto">
                  {preview.subject || '—'}
                </div>
                {preview.parts.map((part) => (
                  <div
                    key={part.lang}
                    lang={part.lang}
                    dir={part.lang === 'ar' ? 'rtl' : 'ltr'}
                    className={`mt-3 border-t border-white/10 pt-3 text-sm leading-relaxed text-white/75 ${
                      part.lang === 'ar' ? 'font-arabic' : ''
                    }`}
                  >
                    {part.paragraphs.map((paragraph, index) => (
                      <p key={index} className="mt-1.5 first:mt-0">
                        {paragraph}
                      </p>
                    ))}
                    <p className="mt-3 text-xs text-white/40">{part.footnote}</p>
                  </div>
                ))}
              </div>
              {reachable.length > 1 ? (
                <p className="mt-2 text-xs text-white/40">
                  Each person gets their own email with their name{template === 'custom' ? '' : ' and their property'}.
                </p>
              ) : null}
            </div>

            <div className="mt-6">
              <div className={labelClass}>Goes to</div>
              <ul className="mt-2 flex flex-wrap gap-2">
                {recipients.map((recipient) => {
                  const hasEmail = isEmailShaped(recipient.email);
                  return (
                    <li
                      key={recipient.id}
                      title={hasEmail ? recipient.email ?? undefined : undefined}
                      className={`rounded-full px-3 py-1 text-xs ${
                        hasEmail ? 'bg-white/10 text-white/75' : 'bg-red-400/10 text-red-300'
                      }`}
                    >
                      {recipient.name}
                      {recipient.referenceCode ? ` · ${recipient.referenceCode}` : ''}
                      {hasEmail ? '' : ' · no email'}
                    </li>
                  );
                })}
              </ul>
            </div>

            {tooMany ? (
              <p className="mt-4 text-sm text-red-300">
                Up to {FOLLOW_UP_MAX_RECIPIENTS} at a time. Untick some and send the rest after.
              </p>
            ) : null}
            {reachable.length === 0 ? (
              <p className="mt-4 text-sm text-red-300">None of them has an email on file.</p>
            ) : null}
            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={send}
                disabled={!canSend}
                className="btn-gold min-h-[44px] flex-1 rounded-full px-6 text-xs font-semibold uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? 'Sending...' : `Send to ${people(reachable.length, audience)}`}
              </button>
              <button
                type="button"
                onClick={close}
                disabled={busy}
                className="min-h-[44px] rounded-full border border-white/15 px-5 text-xs uppercase tracking-[0.16em] text-white/60 disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
