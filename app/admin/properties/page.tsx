import Link from 'next/link';
import { readProperties } from '@/lib/properties-store';
import { PropertiesTable } from '@/components/admin/properties-table';
import { LogoutButton } from '@/components/admin/logout-button';

export default async function AdminPropertiesPage() {
  const properties = await readProperties();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-serif text-xs uppercase tracking-[0.4em] text-[#D9B355]/90">
            GOLD Admin
          </div>
          <h1 className="mt-2 text-2xl font-medium uppercase tracking-[0.1em] text-white">
            Properties
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/properties/new"
            className="btn-gold rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em]"
          >
            + Add property
          </Link>
          <LogoutButton />
        </div>
      </div>

      <p className="mt-4 max-w-xl text-sm text-white/55">
        Properties marked &ldquo;Published&rdquo; appear on the public site&apos;s Featured Listings
        section immediately. Hide a listing instead of deleting it to keep the record for later.
      </p>

      <div className="mt-8">
        <PropertiesTable properties={properties} />
      </div>
    </div>
  );
}
