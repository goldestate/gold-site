import { PropertyForm } from '@/components/admin/property-form';

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]">
        GOLD Admin
      </div>
      <h1 className="mt-2 text-2xl font-medium uppercase tracking-[0.1em] text-white">
        Add property
      </h1>
      <div className="mt-8">
        <PropertyForm />
      </div>
    </div>
  );
}
