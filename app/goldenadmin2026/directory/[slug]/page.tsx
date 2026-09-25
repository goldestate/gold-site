import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompoundBySlug, readCodes, readAllPlaces, readCompounds } from '@/lib/directory-store';
import { CompoundEditor } from '@/components/admin/compound-editor';
import { CompoundSettings } from '@/components/admin/compound-settings';
import { CompoundPin } from '@/components/admin/compound-pin';

export const dynamic = 'force-dynamic';

export default async function CompoundDirectoryPage({ params }: { params: { slug: string } }) {
  const compound = await getCompoundBySlug(params.slug);
  if (!compound) notFound();

  const [places, codes, all] = await Promise.all([
    readAllPlaces(compound.id),
    readCodes(compound.id),
    readCompounds(true)
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/goldenadmin2026/directory"
        className="inline-flex min-h-[40px] items-center text-xs uppercase tracking-[0.18em] text-white/40 transition hover:text-[#D9B355]"
      >
        &larr; All compounds
      </Link>
      <h1 className="mt-1 text-2xl font-medium uppercase tracking-[0.1em] text-white">{compound.nameEn}</h1>
      {compound.active ? null : (
        <p className="mt-2 text-sm text-[#D9A441]">
          Hidden from the app: its codes do not unlock. Show it again under Compound, below.
        </p>
      )}

      <div className="mt-6">
        <CompoundEditor
          compound={compound}
          places={places}
          codes={codes}
          otherCompounds={all
            .filter((item) => item.id !== compound.id)
            // Hidden compounds stay copyable -- their places are still GOLD's
            // data -- but are marked, so nobody mistakes one for a live list.
            .map((item) => ({ id: item.id, nameEn: item.active ? item.nameEn : `${item.nameEn} (hidden)` }))}
        />
      </div>

      <div className="mt-5">
        <CompoundPin
          compound={compound}
          // Live compounds only: a hidden one is not in the app, so it can't
          // take a guest from this one.
          neighbours={all.flatMap((item) =>
            item.id !== compound.id && item.active && item.pin
              ? [{ nameEn: item.nameEn, pin: item.pin, radiusKm: item.radiusKm }]
              : []
          )}
        />
      </div>

      <div className="mt-5">
        <CompoundSettings compound={compound} placeCount={places.length} codeCount={codes.length} />
      </div>
    </div>
  );
}
