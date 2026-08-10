import { notFound } from 'next/navigation';
import { getProperty } from '@/lib/properties-store';
import { PropertyForm } from '@/components/admin/property-form';

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id);
  if (!property) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="font-serif text-xs uppercase tracking-[0.4em] text-[#D9B355]/90">
        GOLD Admin
      </div>
      <h1 className="mt-2 text-2xl font-medium uppercase tracking-[0.1em] text-white">
        Edit property
      </h1>
      <div className="mt-8">
        <PropertyForm property={property} />
      </div>
    </div>
  );
}
