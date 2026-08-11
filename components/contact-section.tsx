'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { SiteCopy } from '@/lib/site-content';
import { UNIT_TYPES } from '@/lib/property-taxonomy';
import { GMark } from './gmark';
import { SectionTitle, SurfaceShell, ArrowIcon } from './section-ui';

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
      <label className="block">
        <span className="mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-white/72">
          {labels.interest}
        </span>
        <select
          value={form.interest}
          onChange={(event) => update('interest', event.target.value)}
          className={`w-full rounded-[1rem] border bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)] ${
            errors.interest ? 'border-red-400/70' : 'border-white/12'
          }`}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <option value="" className="bg-[#231F20] text-white/60">
            {labels.placeholderInterest}
          </option>
          {UNIT_TYPES.map((option) => (
            <option key={option.value} value={option[locale]} className="bg-[#231F20] text-white">
              {option[locale]}
            </option>
          ))}
        </select>
        {errors.interest ? <p className="mt-2 text-xs text-red-300">{errors.interest}</p> : null}
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-white/72">
          {labels.message}
        </span>
        <textarea
          value={form.message}
          onChange={(event) => update('message', event.target.value)}
          rows={5}
          className={`w-full rounded-[1rem] border bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)] ${
            errors.message ? 'border-red-400/70' : 'border-white/12'
          }`}
          placeholder={labels.message}
        />
        {errors.message ? <p className="mt-2 text-xs text-red-300">{errors.message}</p> : null}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-gold inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (isRtl ? 'جار الإرسال...' : 'Sending...') : labels.submit}
        <ArrowIcon rtl={isRtl} />
      </button>

      {formError ? <p className="text-sm text-red-300">{formError}</p> : null}
      {submitted ? <p className="text-sm text-[#D9B355]">{labels.success}</p> : null}
    </form>
  );
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
      <span className="mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-white/72">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`w-full rounded-[1rem] border bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)] ${
          error ? 'border-red-400/70' : 'border-white/12'
        }`}
      />
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </label>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-black/22 px-4 py-4">
      <div className="text-xs uppercase tracking-[0.26em] text-white/52">{label}</div>
      <div className="mt-3 text-sm font-medium leading-6 text-white">{value}</div>
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
    <SurfaceShell id="contact" variant="spotlight" className="px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:px-8">
      <GMark tone="gold" size={560} className={`-bottom-24 opacity-[0.05] ${isRtl ? '-right-24' : '-left-24'}`} />
      <div className="relative mx-auto max-w-7xl">
        <SectionTitle eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} isRtl={isRtl} />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div
            className={`rounded-[2rem] border border-white/10 bg-[rgba(35,31,32,0.78)] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-8 ${
              isRtl ? 'lg:order-2' : 'lg:order-1'
            }`}
          >
            <div className="font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]">
              {copy.formTitle}
            </div>
            <div className="mt-6">
              <InquiryForm labels={copy} locale={locale} isRtl={isRtl} />
            </div>
          </div>

          <div className={`grid gap-6 ${isRtl ? 'lg:order-1' : 'lg:order-2'}`}>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-8">
              <div className="font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]">
                {copy.addressLabel}
              </div>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/74">{copy.address}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoCard label={copy.hotlineLabel} value={copy.hotline} />
                <InfoCard label={copy.emailLabel} value={copy.emailValue} />
              </div>
              <a
                href={`https://www.google.com/maps?q=${MAP_QUERY}`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#D9B355]"
              >
                {copy.mapCta}
                <ArrowIcon rtl={isRtl} />
              </a>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/25 shadow-[0_24px_64px_rgba(0,0,0,0.28)]">
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
