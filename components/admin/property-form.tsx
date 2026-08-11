'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { Property } from '@/lib/properties-store';
import {
  LOCATIONS,
  PROPERTY_TYPES,
  UNIT_TYPES,
  type LocationValue,
  type PropertyTypeValue,
  type UnitTypeValue
} from '@/lib/property-taxonomy';

type PropertyFormProps = {
  property?: Property;
};

const selectClass =
  'w-full rounded-[1rem] border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)]';

export function PropertyForm({ property }: PropertyFormProps) {
  const router = useRouter();
  const isEditing = Boolean(property);

  const [name, setName] = useState(property?.name ?? '');
  const [location, setLocation] = useState<LocationValue>(property?.location ?? LOCATIONS[0].value);
  const [propertyType, setPropertyType] = useState<PropertyTypeValue>(
    property?.propertyType ?? PROPERTY_TYPES[0].value
  );
  const [unitType, setUnitType] = useState<UnitTypeValue>(property?.unitType ?? UNIT_TYPES[0].value);
  const [price, setPrice] = useState(property ? String(property.price) : '');
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

    const parsedPrice = Number(price);
    if (!price || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Enter a valid price.');
      return;
    }
    if (!imageUrl) {
      setError('Upload a photo for this property.');
      return;
    }
    if (!name.trim()) {
      setError('Property name is required.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      location,
      propertyType,
      unitType,
      price: parsedPrice,
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

      router.push(`/goldenadmin2026/properties?${isEditing ? 'updated' : 'created'}=1`);
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
            className="w-full rounded-[1rem] border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-white/72">
            Location
          </span>
          <select
            value={location}
            onChange={(event) => setLocation(event.target.value as LocationValue)}
            className={selectClass}
          >
            {LOCATIONS.map((item) => (
              <option key={item.value} value={item.value} className="bg-[#231F20]">
                {item.en}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-white/72">
            Property type
          </span>
          <select
            value={propertyType}
            onChange={(event) => setPropertyType(event.target.value as PropertyTypeValue)}
            className={selectClass}
          >
            {PROPERTY_TYPES.map((item) => (
              <option key={item.value} value={item.value} className="bg-[#231F20]">
                {item.en}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-white/72">
            Unit type
          </span>
          <select
            value={unitType}
            onChange={(event) => setUnitType(event.target.value as UnitTypeValue)}
            className={selectClass}
          >
            {UNIT_TYPES.map((item) => (
              <option key={item.value} value={item.value} className="bg-[#231F20]">
                {item.en}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-white/72">
            Price (EGP)
          </span>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="18000000"
            className="w-full rounded-[1rem] border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-white/72">
            Photo treatment
          </span>
          <select
            value={tone}
            onChange={(event) => setTone(event.target.value as 'color' | 'mono')}
            className={selectClass}
          >
            <option value="color" className="bg-[#231F20]">
              Color
            </option>
            <option value="mono" className="bg-[#231F20]">
              Black & white
            </option>
          </select>
        </label>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={published}
          onChange={(event) => setPublished(event.target.checked)}
          className="h-5 w-5 rounded border-white/20 bg-white/5 accent-[#D9B355]"
        />
        <span className="text-sm text-white/80">Published (visible on the public site)</span>
      </label>

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
          onClick={() => router.push('/goldenadmin2026/properties')}
          className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium uppercase tracking-[0.2em] text-white/75 transition hover:border-white/30"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
