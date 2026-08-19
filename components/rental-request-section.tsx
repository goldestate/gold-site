'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import type { SiteCopy } from '@/lib/site-content';
import { LOCATIONS } from '@/lib/property-taxonomy';
import { RENTAL_PERIODS, RENTAL_PROPERTY_TYPES } from '@/lib/rental-taxonomy';
import { GMark } from './gmark';
import { SectionTitle, SurfaceShell, ArrowIcon } from './section-ui';

const inputClass =
  'w-full rounded-[1rem] border bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)]';
const labelClass = 'mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-white/72';

type FormState = {
  name: string;
  company: string;
  phone: string;
  whatsapp: string;
  email: string;
  propertyType: string;
  location: string;
  budgetMin: string;
  budgetMax: string;
  bedrooms: string;
  furnished: '' | 'yes' | 'no';
  moveInDate: string;
  rentalPeriod: string;
  notes: string;
};

const emptyForm: FormState = {
  name: '',
  company: '',
  phone: '',
  whatsapp: '',
  email: '',
  propertyType: '',
  location: '',
  budgetMin: '',
  budgetMax: '',
  bedrooms: '',
  furnished: '',
  moveInDate: '',
  rentalPeriod: '',
  notes: ''
};

function Field({
  label,
  value,
  onChange,
  error,
  isRtl,
  type = 'text',
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  isRtl: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`${inputClass} ${error ? 'border-red-400/70' : 'border-white/12'}`}
      />
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  error,
  isRtl,
  children
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  isRtl: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`${inputClass} ${error ? 'border-red-400/70' : 'border-white/12'}`}
      >
        {children}
      </select>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </label>
  );
}

export function RentalRequestSection({
  copy,
  locale,
  isRtl
}: {
  copy: SiteCopy['rentalRequestPage'];
  locale: 'en' | 'ar';
  isRtl: boolean;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceCode, setReferenceCode] = useState<string | null>(null);

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) nextErrors.name = copy.errors.name;
    if (!/^[+()0-9\s-]{7,}$/.test(form.phone.trim())) nextErrors.phone = copy.errors.phone;
    if (!form.propertyType) nextErrors.propertyType = copy.errors.propertyType;
    if (!form.location) nextErrors.location = copy.errors.location;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const response = await fetch('/api/rental-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          company: form.company.trim() || undefined,
          phone: form.phone.trim(),
          whatsapp: form.whatsapp.trim() || undefined,
          email: form.email.trim() || undefined,
          propertyType: form.propertyType,
          location: form.location,
          budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
          budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
          bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
          furnished: form.furnished ? form.furnished === 'yes' : undefined,
          moveInDate: form.moveInDate || undefined,
          rentalPeriod: form.rentalPeriod || undefined,
          notes: form.notes.trim() || undefined
        })
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFormError(body.error || copy.errors.generic);
        return;
      }

      setReferenceCode(body.referenceCode);
    } catch {
      setFormError(copy.errors.generic);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startOver = () => {
    setForm(emptyForm);
    setErrors({});
    setFormError('');
    setReferenceCode(null);
  };

  return (
    <SurfaceShell variant="spotlight" className="px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:px-8">
      <GMark tone="gold" size={560} className={`-bottom-24 opacity-[0.05] ${isRtl ? '-right-24' : '-left-24'}`} />
      <div className="relative mx-auto max-w-3xl">
        <SectionTitle eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} isRtl={isRtl} />

        <div className="mt-12 rounded-[2rem] border border-white/10 bg-[rgba(35,31,32,0.78)] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-8">
          {referenceCode ? (
            <div className="py-6 text-center">
              <div className="font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]">
                {copy.successTitle}
              </div>
              <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/74">{copy.successBody}</p>
              <div className="mt-6 inline-flex flex-col items-center gap-1 rounded-[1.2rem] border border-white/10 bg-black/22 px-6 py-4">
                <span className="text-xs uppercase tracking-[0.26em] text-white/52">{copy.referenceLabel}</span>
                <span className="gold-gradient-text text-2xl font-medium tracking-[0.16em]">{referenceCode}</span>
              </div>
              <div className="mt-8">
                <button
                  type="button"
                  onClick={startOver}
                  className="btn-gold inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] transition hover:-translate-y-0.5"
                >
                  {copy.submitAnother}
                  <ArrowIcon rtl={isRtl} />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <div className="font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]">
                  {copy.brokerSectionTitle}
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field label={copy.name} value={form.name} onChange={(v) => update('name', v)} error={errors.name} isRtl={isRtl} />
                  <Field label={copy.company} value={form.company} onChange={(v) => update('company', v)} isRtl={isRtl} />
                  <Field
                    label={copy.phone}
                    value={form.phone}
                    onChange={(v) => update('phone', v)}
                    error={errors.phone}
                    isRtl={isRtl}
                    placeholder="+20 1..."
                  />
                  <Field label={copy.whatsapp} value={form.whatsapp} onChange={(v) => update('whatsapp', v)} isRtl={isRtl} placeholder="+20 1..." />
                  <Field label={copy.email} value={form.email} onChange={(v) => update('email', v)} isRtl={isRtl} placeholder="name@example.com" />
                </div>
              </div>

              <div>
                <div className="font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]">
                  {copy.requestSectionTitle}
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <SelectField label={copy.propertyTypeLabel} value={form.propertyType} onChange={(v) => update('propertyType', v)} error={errors.propertyType} isRtl={isRtl}>
                    <option value="" className="bg-[#231F20] text-white/60" />
                    {RENTAL_PROPERTY_TYPES.map((item) => (
                      <option key={item.value} value={item.value} className="bg-[#231F20] text-white">
                        {item[locale]}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField label={copy.locationLabel} value={form.location} onChange={(v) => update('location', v)} error={errors.location} isRtl={isRtl}>
                    <option value="" className="bg-[#231F20] text-white/60" />
                    {LOCATIONS.map((item) => (
                      <option key={item.value} value={item.value} className="bg-[#231F20] text-white">
                        {item[locale]}
                      </option>
                    ))}
                  </SelectField>
                  <Field label={copy.budgetMinLabel} type="number" value={form.budgetMin} onChange={(v) => update('budgetMin', v)} isRtl={isRtl} />
                  <Field label={copy.budgetMaxLabel} type="number" value={form.budgetMax} onChange={(v) => update('budgetMax', v)} isRtl={isRtl} />
                  <Field label={copy.bedroomsLabel} type="number" value={form.bedrooms} onChange={(v) => update('bedrooms', v)} isRtl={isRtl} />
                  <SelectField label={copy.furnishedLabel} value={form.furnished} onChange={(v) => update('furnished', v as FormState['furnished'])} isRtl={isRtl}>
                    <option value="" className="bg-[#231F20] text-white">{copy.furnishedAny}</option>
                    <option value="yes" className="bg-[#231F20] text-white">{copy.furnishedYes}</option>
                    <option value="no" className="bg-[#231F20] text-white">{copy.furnishedNo}</option>
                  </SelectField>
                  <Field label={copy.moveInDateLabel} type="date" value={form.moveInDate} onChange={(v) => update('moveInDate', v)} isRtl={isRtl} />
                  <SelectField label={copy.rentalPeriodLabel} value={form.rentalPeriod} onChange={(v) => update('rentalPeriod', v)} isRtl={isRtl}>
                    <option value="" className="bg-[#231F20] text-white">{copy.rentalPeriodAny}</option>
                    {RENTAL_PERIODS.map((item) => (
                      <option key={item.value} value={item.value} className="bg-[#231F20] text-white">
                        {item[locale]}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <label className="mt-4 block">
                  <span className={labelClass}>{copy.notesLabel}</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) => update('notes', event.target.value)}
                    rows={4}
                    dir={isRtl ? 'rtl' : 'ltr'}
                    className={`${inputClass} border-white/12`}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-gold inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? copy.submitting : copy.submit}
                <ArrowIcon rtl={isRtl} />
              </button>

              {formError ? <p className="text-sm text-red-300">{formError}</p> : null}
            </form>
          )}
        </div>
      </div>
    </SurfaceShell>
  );
}
