'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { SiteCopy } from '@/lib/site-content';
import { goldWhatsAppUrl } from '@/lib/app-links';
import { UNIT_TYPES } from '@/lib/property-taxonomy';
import { GMark } from './gmark';
import { SectionTitle, SurfaceShell, ArrowIcon } from './section-ui';
import { GoldSelect } from './gold-select';

const MAP_QUERY = encodeURIComponent(
  'The Office, Tolip El Narge, El Tagmoa El Khames, 90th Street, New Cairo, Egypt'
);
const MAP_SRC = `https://www.google.com/maps?q=${MAP_QUERY}&output=embed`;

function InquiryForm({ labels, locale, isRtl }: { labels: SiteCopy['contact']; locale: 'en' | 'ar'; isRtl: boolean }) {
  const searchParams = useSearchParams();
  const interestParam = searchParams.get('interest');
  const initialMessage = interestParam ? labels.prefillMessage.replace('{property}', interestParam) : '';

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    interest: '',
    message: initialMessage
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
    setSubmitted(false);
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof typeof form, string>> = {};
    if (!form.name.trim()) nextErrors.name = labels.errors.name;
    if (!/^[+()0-9\s-]{7,}$/.test(form.phone.trim())) nextErrors.phone = labels.errors.phone;
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = labels.errors.email;
    if (!form.message.trim()) nextErrors.message = labels.errors.message;
    if (!form.interest.trim()) nextErrors.interest = labels.errors.interest;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        throw new Error('Inquiry email failed');
      }

      setSubmitted(true);
      setForm({
        name: '',
        phone: '',
        email: '',
        interest: '',
        message: ''
      });
    } catch {
      setFormError(
        isRtl
          ? 'تعذر إرسال الاستفسار الآن. حاول مرة أخرى لاحقاً.'
          : 'We could not send your inquiry right now. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={labels.name}
          value={form.name}
          error={errors.name}
          onChange={(value) => update('name', value)}
          placeholder={labels.name}
          isRtl={isRtl}
        />
        <Field
          label={labels.phone}
          value={form.phone}
          error={errors.phone}
          onChange={(value) => update('phone', value)}
          placeholder="+20 1..."
          isRtl={isRtl}
        />
      </div>
      <Field
        label={labels.email}
        value={form.email}
        error={errors.email}
        onChange={(value) => update('email', value)}
        placeholder="name@example.com"
        isRtl={isRtl}
      />
      <div className="block">
        <span className="mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-white/[0.72]">
          {labels.interest}
        </span>
        <GoldSelect
          label={labels.interest}
          value={form.interest}
          onChange={(value) => update('interest', value)}
          isRtl={isRtl}
          placeholder={labels.placeholderInterest}
          triggerClassName={`w-full rounded-xl border bg-white/[0.04] px-4 py-3.5 text-[0.95rem] text-white outline-none transition focus-visible:border-[#D9B355] focus-visible:ring-2 focus-visible:ring-[rgba(217,179,85,0.22)] ${
            errors.interest ? 'border-red-400/70' : 'border-white/[0.12]'
          }`}
          // The enquiry has always sent the label in the visitor's language, so
          // the value stays the label.
          options={UNIT_TYPES.map((option) => ({ value: option[locale], label: option[locale] }))}
        />
        {errors.interest ? <p className="mt-2 text-xs text-red-300">{errors.interest}</p> : null}
      </div>
      <label className="block">
        <span className="mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-white/[0.72]">
          {labels.message}
        </span>
        <textarea
          value={form.message}
          onChange={(event) => update('message', event.target.value)}
          rows={5}
          className={`w-full rounded-xl border bg-white/[0.04] px-4 py-3.5 text-[0.95rem] text-white outline-none transition placeholder:text-white/30 focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)] ${
            errors.message ? 'border-red-400/70' : 'border-white/[0.12]'
          }`}
          placeholder={labels.message}
        />
        {errors.message ? <p className="mt-2 text-xs text-red-300">{errors.message}</p> : null}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-gold inline-flex h-12 items-center gap-3 rounded-full px-8 text-sm font-medium uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (isRtl ? 'جار الإرسال...' : 'Sending...') : labels.submit}
        <ArrowIcon rtl={isRtl} />
      </button>

      {formError ? <p className="text-sm text-red-300">{formError}</p> : null}
      {submitted ? <p className="text-sm text-[#D9B355]">{labels.success}</p> : null}
    </form>
  );
}

/**
 * Phone numbers and email addresses read left to right even on Arabic pages
 * (otherwise "+20 1..." shows as "...1 20+"). Those are the fields whose example
 * is written in Latin characters, so the example decides.
 */
function fieldDirection(isRtl: boolean, placeholder?: string): 'rtl' | 'ltr' {
  return isRtl && !/^[\x21-\x7E]/.test(placeholder ?? '') ? 'rtl' : 'ltr';
}

function Field({
  label,
  value,
  error,
  onChange,
  placeholder,
  isRtl
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder: string;
  isRtl: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-white/[0.72]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        dir={fieldDirection(isRtl, placeholder)}
        className={`w-full rounded-xl border bg-white/[0.04] px-4 py-3.5 text-[0.95rem] text-white outline-none transition placeholder:text-white/30 focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)] ${
          error ? 'border-red-400/70' : 'border-white/[0.12]'
        }`}
      />
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </label>
  );
}

function InfoCard({
  label,
  value,
  href,
  external = false,
  ltr = false
}: {
  label: string;
  value: string;
  href?: string;
  /** Opens in a new tab: WhatsApp, rather than a tel: or mailto: link. */
  external?: boolean;
  /** Phone numbers read left to right even on Arabic pages, or "+20" ends up last. */
  ltr?: boolean;
}) {
  const text = ltr ? <span dir="ltr">{value}</span> : value;

  return (
    <div className="rounded-xl bg-white/[0.03] px-4 py-4 ring-1 ring-white/10">
      <div className="text-xs uppercase tracking-[0.26em] text-white/50">{label}</div>
      {href ? (
        <a
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="mt-2 block text-[0.95rem] font-medium leading-6 text-white transition hover:text-[#D9B355]"
        >
          {text}
        </a>
      ) : (
        <div className="mt-2 text-[0.95rem] font-medium leading-6 text-white">{text}</div>
      )}
    </div>
  );
}

export function ContactSection({
  copy,
  locale,
  isRtl
}: {
  copy: SiteCopy['contact'];
  locale: 'en' | 'ar';
  isRtl: boolean;
}) {
  return (
    <SurfaceShell id="contact" variant="spotlight" className="px-4 pb-24 pt-32 sm:px-6 sm:pt-40 lg:px-8">
      <GMark tone="gold" size={560} className="-bottom-24 -start-24 opacity-[0.05]" />
      <div className="relative mx-auto max-w-7xl">
        <SectionTitle eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} isRtl={isRtl} />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.5rem] bg-[#1B1718] p-6 shadow-[0_30px_70px_-35px_rgba(0,0,0,0.7)] ring-1 ring-white/10 sm:p-9">
            <div className="font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]">
              {copy.formTitle}
            </div>
            <div className="mt-6">
              <InquiryForm labels={copy} locale={locale} isRtl={isRtl} />
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[1.5rem] bg-white/[0.035] p-6 ring-1 ring-white/10 sm:p-9">
              <div className="font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]">
                {copy.addressLabel}
              </div>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/[0.74]">{copy.address}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoCard
                  label={copy.whatsappLabel}
                  value={copy.hotline}
                  href={goldWhatsAppUrl(copy.whatsappMessage)}
                  external
                  ltr
                />
                <InfoCard
                  label={copy.hotlineLabel}
                  value={copy.hotline}
                  href={`tel:${copy.hotline.replace(/[^+\d]/g, '')}`}
                  ltr
                />
                <div className="sm:col-span-2">
                  <InfoCard label={copy.emailLabel} value={copy.emailValue} href={`mailto:${copy.emailValue}`} />
                </div>
              </div>
              <a
                href={`https://www.google.com/maps?q=${MAP_QUERY}`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#D9B355] transition hover:text-[#ECD08A]"
              >
                {copy.mapCta}
                <ArrowIcon rtl={isRtl} />
              </a>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] bg-black/25 ring-1 ring-white/10">
              <iframe
                title="GOLD office map"
                src={MAP_SRC}
                className="h-[22rem] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </SurfaceShell>
  );
}
