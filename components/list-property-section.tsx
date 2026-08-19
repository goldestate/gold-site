'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import type { SiteCopy } from '@/lib/site-content';
import { LOCATIONS } from '@/lib/property-taxonomy';
import { RENTAL_PROPERTY_TYPES } from '@/lib/rental-taxonomy';
import { GMark } from './gmark';
import { SectionTitle, SurfaceShell, ArrowIcon } from './section-ui';

const inputClass =
  'w-full rounded-[1rem] border bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)]';
const labelClass = 'mb-2 block text-sm font-medium uppercase tracking-[0.18em] text-white/72';

type PhotoItem = {
  key: string;
  previewUrl: string;
  uploadedUrl: string | null;
  status: 'uploading' | 'done' | 'error';
  error?: string;
};

type FormState = {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  propertyType: string;
  location: string;
  price: string;
  bedrooms: string;
  furnished: '' | 'yes' | 'no';
  availableFrom: string;
};

const emptyForm: FormState = {
  name: '',
  phone: '',
  whatsapp: '',
  email: '',
  propertyType: '',
  location: '',
  price: '',
  bedrooms: '',
  furnished: '',
  availableFrom: ''
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

export function ListPropertySection({
  copy,
  locale,
  isRtl
}: {
  copy: SiteCopy['listPropertyPage'];
  locale: 'en' | 'ar';
  isRtl: boolean;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isUploading = photos.some((photo) => photo.status === 'uploading');

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  };

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    setFormError('');

    const newItems: PhotoItem[] = files.map((file) => ({
      key: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
      uploadedUrl: null,
      status: 'uploading'
    }));
    setPhotos((prev) => [...prev, ...newItems]);

    await Promise.all(
      files.map(async (file, index) => {
        const item = newItems[index];
        try {
          const body = new FormData();
          body.append('file', file);
          const response = await fetch('/api/rental-upload', { method: 'POST', body });
          const result = await response.json().catch(() => ({}));

          if (!response.ok) {
            setPhotos((prev) =>
              prev.map((photo) =>
                photo.key === item.key ? { ...photo, status: 'error', error: result.error || 'Upload failed.' } : photo
              )
            );
            return;
          }

          setPhotos((prev) =>
            prev.map((photo) => (photo.key === item.key ? { ...photo, uploadedUrl: result.url, status: 'done' } : photo))
          );
        } catch {
          setPhotos((prev) =>
            prev.map((photo) => (photo.key === item.key ? { ...photo, status: 'error', error: 'Upload failed.' } : photo))
          );
        }
      })
    );
  };

  const removePhoto = (key: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.key !== key));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) nextErrors.name = copy.errors.name;
    if (!/^[+()0-9\s-]{7,}$/.test(form.phone.trim())) nextErrors.phone = copy.errors.phone;
    if (!form.propertyType) nextErrors.propertyType = copy.errors.propertyType;
    if (!form.location) nextErrors.location = copy.errors.location;
    const parsedPrice = Number(form.price);
    if (!form.price || Number.isNaN(parsedPrice) || parsedPrice < 0) nextErrors.price = copy.errors.price;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const uploadedPhotos = photos.filter((photo) => photo.status === 'done' && photo.uploadedUrl).map(
      (photo) => photo.uploadedUrl as string
    );
    if (isUploading) {
      setFormError(copy.errors.photos);
      return;
    }
    if (uploadedPhotos.length === 0) {
      setFormError(copy.errors.photos);
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const response = await fetch('/api/list-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          whatsapp: form.whatsapp.trim() || undefined,
          email: form.email.trim() || undefined,
          propertyType: form.propertyType,
          location: form.location,
          price: Number(form.price),
          bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
          furnished: form.furnished ? form.furnished === 'yes' : undefined,
          availableFrom: form.availableFrom || undefined,
          photos: uploadedPhotos
        })
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFormError(body.error || copy.errors.generic);
        return;
      }

      setSubmitted(true);
    } catch {
      setFormError(copy.errors.generic);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startOver = () => {
    setForm(emptyForm);
    setPhotos([]);
    setErrors({});
    setFormError('');
    setSubmitted(false);
  };

  return (
    <SurfaceShell variant="spotlight" className="px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:px-8">
      <GMark tone="gold" size={560} className={`-bottom-24 opacity-[0.05] ${isRtl ? '-right-24' : '-left-24'}`} />
      <div className="relative mx-auto max-w-3xl">
        <SectionTitle eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} isRtl={isRtl} />

        <div className="mt-12 rounded-[2rem] border border-white/10 bg-[rgba(35,31,32,0.78)] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.28)] backdrop-blur-md sm:p-8">
          {submitted ? (
            <div className="py-6 text-center">
              <div className="font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]">
                {copy.successTitle}
              </div>
              <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/74">{copy.successBody}</p>
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
                  {copy.ownerSectionTitle}
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field label={copy.name} value={form.name} onChange={(v) => update('name', v)} error={errors.name} isRtl={isRtl} />
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
                  {copy.listingSectionTitle}
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
                  <Field label={copy.priceLabel} type="number" value={form.price} onChange={(v) => update('price', v)} error={errors.price} isRtl={isRtl} />
                  <Field label={copy.bedroomsLabel} type="number" value={form.bedrooms} onChange={(v) => update('bedrooms', v)} isRtl={isRtl} />
                  <SelectField label={copy.furnishedLabel} value={form.furnished} onChange={(v) => update('furnished', v as FormState['furnished'])} isRtl={isRtl}>
                    <option value="" className="bg-[#231F20] text-white/60" />
                    <option value="yes" className="bg-[#231F20] text-white">{copy.furnishedYes}</option>
                    <option value="no" className="bg-[#231F20] text-white">{copy.furnishedNo}</option>
                  </SelectField>
                  <Field label={copy.availableFromLabel} type="date" value={form.availableFrom} onChange={(v) => update('availableFrom', v)} isRtl={isRtl} />
                </div>
              </div>

              <div>
                <span className={labelClass}>{copy.photosLabel}</span>
                <p className="mb-3 text-xs text-white/50">{copy.photosHint}</p>

                {photos.length > 0 ? (
                  <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {photos.map((photo) => (
                      <div key={photo.key} className="relative aspect-square overflow-hidden rounded-[0.75rem] border border-white/12 bg-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
                        {photo.status === 'uploading' ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-[10px] font-medium text-white">
                            Uploading...
                          </div>
                        ) : null}
                        {photo.status === 'error' ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-900/70 p-1 text-center text-[9px] font-medium text-red-100">
                            {photo.error || 'Upload failed'}
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.key)}
                          aria-label="Remove photo"
                          className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white/80 transition hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  multiple
                  onChange={handleFilesSelected}
                  className="block w-full text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-white hover:file:bg-white/15"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isUploading}
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
