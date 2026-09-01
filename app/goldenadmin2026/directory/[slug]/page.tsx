import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompoundBySlug, readActiveCode, readAllPlaces, readCompounds } from '@/lib/directory-store';
import { CompoundEditor } from '@/components/admin/compound-editor';

export const dynamic = 'force-dynamic';

export default async function CompoundDirectoryPage({ params }: { params: { slug: string } }) {
  const compound = await getCompoundBySlug(params.slug);
  if (!compound) notFound();

  const [places, code, all] = await Promise.all([
    readAllPlaces(compound.id),
    readActiveCode(compound.id),
    readCompounds(true)
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/goldenadmin2026/directory"
        className="text-xs uppercase tracking-[0.18em] text-white/40 transition hover:text-[#D9B355]"
      >
        &larr; All compounds
      </Link>
      <h1 className="mt-3 text-2xl font-medium uppercase tracking-[0.1em] text-white">{compound.nameEn}</h1>
      <p className="mt-1 text-sm text-white/45">
        Matches listings named: {compound.matchNames.join(', ') || compound.nameEn}
      </p>

      <div className="mt-6">
        <CompoundEditor
          compound={compound}
          places={places}
          code={code}
          otherCompounds={all
            .filter((item) => item.id !== compound.id)
            .map((item) => ({ id: item.id, nameEn: item.nameEn }))}
        />
      </div>
    </div>
  );
}
