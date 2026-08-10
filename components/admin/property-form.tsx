'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { Property } from '@/lib/properties-store';

type PropertyFormProps = {
  property?: Property;
};

export function PropertyForm({ property }: PropertyFormProps) {
  const router = useRouter();
  const isEditing = Boolean(property);

  const [name, setName] = useState(property?.name ?? '');
  const [location, setLocation] = useState(property?.location ?? '');
  const [priceMin, setPriceMin] = useState(property ? String(property.priceMin) : '');
  const [priceMax, setPriceMax] = useState(property?.priceMax ? String(property.priceMax) : '');
  const [tone, setTone] = useState<'color' | 'mono'>(property?.tone ?? 'color');
  const [published, setPublished] = useState(property?.published ?? true);
  const [imageUrl, setImageUrl] = useState(property?.image ?? '');
  const [imagePreview, setImagePreview] = useState(property?.image ?? '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setIsUploading(true);
    setError('');

    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: form });
      const body = await response.json();

      if (!response.ok) {
        setError(body.error || 'Image upload failed.');
        return;
      }

      setImageUrl(body.url);
    } catch {
      setError('Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const parsedMin = Number(priceMin);
    if (!priceMin || Number.isNaN(parsedMin) || parsedMin < 0) {
      setError('Enter a valid starting price.');
      return;
    }
    const parsedMax = priceMax ? Number(priceMax) : null;
    if (priceMax && (Number.isNaN(parsedMax as number) || (parsedMax as number) < parsedMin)) {
      setError('Max price must be a number greater than the starting price.');
      return;
    }
    if (!imageUrl) {
      setError('Upload a photo for this property.');
      return;
    }
    if (!name.trim() || !location.trim()) {
      setError('Name and location are required.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      location: location.trim(),
      priceMin: parsedMin,
      priceMax: parsedMax,
      image: imageUrl,
      tone,
      published
    };

    try {
      const response = await fetch(isEditing ? `/api/properties/${property!.id}` : '/api/properties', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error || 'Could not save this property.');
        return;
      }

      router.push('/admin/properties');
      router.refresh();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-white/72">
            Property name
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-[1rem] border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#D9B355] focus:ring-2 focus:ring-[#D9B355]/22"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-white/72">
            Location
          </span>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="e.g. New Cairo, Egypt"
            className="w-full rounded-[1rem] border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#D9B355] focus:ring-2 focus:ring-[#D9B355]/22"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-white/72">
            Starting price (EGP)
          </span>
          <input
            type="number"
            min={0}
            value={priceMin}
            onChange={(event) => setPriceMin(event.target.value)}
            placeholder="18000000"
            className="w-full rounded-[1rem] border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#D9B355] focus:ring-2 focus:ring-[#D9B355]/22"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-white/72">
            Max price (optional)
          </span>
          <input
            type="number"
            min={0}
            value={priceMax}
            onChange={(event) => setPriceMax(event.target.value)}
            placeholder="26000000"
            className="w-full rounded-[1rem] border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#D9B355] focus:ring-2 focus:ring-[#D9B355]/22"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-white/72">
            Photo treatment
          </span>
          <select
            value={tone}
            onChange={(event) => setTone(event.target.value as 'color' | 'mono')}
            className="w-full rounded-[1rem] border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#D9B355] focus:ring-2 focus:ring-[#D9B355]/22"
          >
            <option value="color" className="bg-[#231F20]">
              Color
            </option>
            <option value="mono" className="bg-[#231F20]">
              Black & white
            </option>
          </select>
        </label>
        <label className="flex items-center gap-3 pt-8">
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
            className="h-5 w-5 rounded border-white/20 bg-white/5 accent-[#D9B355]"
          />
          <span className="text-sm text-white/80">Published (visible on the public site)</span>
        </label>
      </div>

      <div className="block">
        <span className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-white/72">
          Photo
        </span>
        {imagePreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagePreview}
            alt="Property preview"
            className="mb-3 h-48 w-full max-w-sm rounded-[1rem] object-cover"
          />
        ) : null}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={handleFileChange}
          className="block w-full text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-white hover:file:bg-white/15"
        />
        {isUploading ? <p className="mt-2 text-xs text-white/50">Uploading...</p> : null}
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="btn-gold rounded-full px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Save changes' : 'Add property'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/properties')}
          className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-white/75 transition hover:border-white/30"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
