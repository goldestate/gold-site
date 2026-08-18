'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { Property } from '@/lib/properties-store';
import {
  LOCATIONS,
  PROPERTY_TYPES,
  UNIT_TYPES,
  showsArea,
  type LocationValue,
  type PropertyTypeValue,
  type UnitTypeValue
} from '@/lib/property-taxonomy';

type PropertyFormProps = {
  property?: Property;
};

type PhotoItem = {
  key: string;
  previewUrl: string;
  uploadedUrl: string | null;
  status: 'uploading' | 'done' | 'error';
  error?: string;
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
  const [bedrooms, setBedrooms] = useState(property ? String(property.bedrooms) : '');
  const [bathrooms, setBathrooms] = useState(property ? String(property.bathrooms) : '');
  const [area, setArea] = useState(property ? String(property.area) : '');
  const [description, setDescription] = useState(property?.description ?? '');
  const [tone, setTone] = useState<'color' | 'mono'>(property?.tone ?? 'color');
  const [published, setPublished] = useState(property?.published ?? true);
  const [photos, setPhotos] = useState<PhotoItem[]>(() =>
    (property?.images ?? []).map((url) => ({
      key: crypto.randomUUID(),
      previewUrl: url,
      uploadedUrl: url,
      status: 'done' as const
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isUploading = photos.some((photo) => photo.status === 'uploading');
  const propertyHasArea = showsArea(propertyType);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    setError('');

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
          const form = new FormData();
          form.append('file', file);
          const response = await fetch('/api/upload', { method: 'POST', body: form });
          const body = await response.json();

          if (!response.ok) {
            setPhotos((prev) =>
              prev.map((photo) =>
                photo.key === item.key ? { ...photo, status: 'error', error: body.error || 'Upload failed.' } : photo
              )
            );
            return;
          }

          setPhotos((prev) =>
            prev.map((photo) => (photo.key === item.key ? { ...photo, uploadedUrl: body.url, status: 'done' } : photo))
          );
        } catch {
          setPhotos((prev) =>
            prev.map((photo) =>
              photo.key === item.key ? { ...photo, status: 'error', error: 'Upload failed. Please try again.' } : photo
            )
          );
        }
      })
    );
  };

  const removePhoto = (key: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.key !== key));
  };

  const movePhoto = (key: string, direction: -1 | 1) => {
    setPhotos((prev) => {
      const index = prev.findIndex((photo) => photo.key === key);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const reorderPhoto = (draggedPhotoKey: string, targetKey: string) => {
    if (draggedPhotoKey === targetKey) return;
    setPhotos((prev) => {
      const fromIndex = prev.findIndex((photo) => photo.key === draggedPhotoKey);
      const toIndex = prev.findIndex((photo) => photo.key === targetKey);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const makeCoverPhoto = (key: string) => {
    setPhotos((prev) => {
      const index = prev.findIndex((photo) => photo.key === key);
      if (index <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const parsedPrice = Number(price);
    if (!price || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Enter a valid price.');
      return;
    }
    const parsedBedrooms = Number(bedrooms);
    if (!bedrooms || Number.isNaN(parsedBedrooms) || parsedBedrooms < 0) {
      setError('Enter a valid number of bedrooms.');
      return;
    }
    const parsedBathrooms = Number(bathrooms);
    if (!bathrooms || Number.isNaN(parsedBathrooms) || parsedBathrooms < 0) {
      setError('Enter a valid number of bathrooms.');
      return;
    }
    let parsedArea = 0;
    if (propertyHasArea) {
      parsedArea = Number(area);
      if (!area || Number.isNaN(parsedArea) || parsedArea < 0) {
        setError('Enter a valid area in m².');
        return;
      }
    }
    if (isUploading) {
      setError('Please wait for photo uploads to finish.');
      return;
    }
    const uploadedImages = photos.filter((photo) => photo.status === 'done' && photo.uploadedUrl).map(
      (photo) => photo.uploadedUrl as string
    );
    if (uploadedImages.length === 0) {
      setError('Upload at least one photo for this property.');
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
      bedrooms: parsedBedrooms,
      bathrooms: parsedBathrooms,
      area: parsedArea,
      description: description.trim(),
      images: uploadedImages,
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

      <div className={`grid gap-5 ${propertyHasArea ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-white/72">
            Bedrooms
          </span>
          <input
            type="number"
            min={0}
            value={bedrooms}
            onChange={(event) => setBedrooms(event.target.value)}
            placeholder="3"
            className="w-full rounded-[1rem] border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)]"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-white/72">
            Bathrooms
          </span>
          <input
            type="number"
            min={0}
            value={bathrooms}
            onChange={(event) => setBathrooms(event.target.value)}
            placeholder="2"
            className="w-full rounded-[1rem] border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)]"
          />
        </label>
        {propertyHasArea ? (
          <label className="block">
            <span className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-white/72">
              Area (m²)
            </span>
            <input
              type="number"
              min={0}
              value={area}
              onChange={(event) => setArea(event.target.value)}
              placeholder="210"
              className="w-full rounded-[1rem] border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)]"
            />
          </label>
        ) : null}
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium uppercase tracking-[0.16em] text-white/72">
          Description
        </span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          placeholder="A short description highlighting what makes this property stand out."
          className="w-full rounded-[1rem] border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#D9B355] focus:ring-2 focus:ring-[rgba(217,179,85,0.22)]"
        />
      </label>

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
          Photos
        </span>
        <p className="mb-3 text-xs text-white/50">
          The first photo is the cover shown on listing cards. Select as many as you like at once, then drag them
          into order (or use the arrows below each one) — the first spot is the cover.
        </p>

        {photos.length > 0 ? (
          <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((photo, index) => (
              <div
                key={photo.key}
                draggable={photo.status === 'done'}
                onDragStart={() => setDraggedKey(photo.key)}
                onDragOver={(event) => {
                  if (draggedKey && draggedKey !== photo.key) event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggedKey) reorderPhoto(draggedKey, photo.key);
                  setDraggedKey(null);
                }}
                onDragEnd={() => setDraggedKey(null)}
                className={`relative aspect-square overflow-hidden rounded-[0.75rem] border bg-white/5 transition ${
                  draggedKey === photo.key ? 'opacity-40' : ''
                } ${photo.status === 'done' ? 'cursor-grab border-white/12 active:cursor-grabbing' : 'border-white/12'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />

                {index === 0 ? (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-[#D9B355] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#231F20]">
                    Cover
                  </span>
                ) : null}

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

                {photo.status === 'done' ? (
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-0.5 bg-black/65 px-1 py-1">
                    <button
                      type="button"
                      onClick={() => movePhoto(photo.key, -1)}
                      disabled={index === 0}
                      aria-label="Move left"
                      className="rounded px-1 text-xs text-white/80 transition hover:text-[#D9B355] disabled:opacity-25"
                    >
                      ‹
                    </button>
                    {index !== 0 ? (
                      <button
                        type="button"
                        onClick={() => makeCoverPhoto(photo.key)}
                        aria-label="Set as cover photo"
                        className="rounded px-1 text-xs text-white/80 transition hover:text-[#D9B355]"
                      >
                        ★
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => movePhoto(photo.key, 1)}
                      disabled={index === photos.length - 1}
                      aria-label="Move right"
                      className="rounded px-1 text-xs text-white/80 transition hover:text-[#D9B355] disabled:opacity-25"
                    >
                      ›
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.key)}
                      aria-label="Remove photo"
                      className="rounded px-1 text-xs text-red-300 transition hover:text-red-200"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.key)}
                    aria-label="Remove photo"
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white/80 transition hover:text-red-300"
                  >
                    ✕
                  </button>
                )}
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
