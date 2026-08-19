import Link from 'next/link';
import { readProperties } from '@/lib/properties-store';
import { PropertiesTable } from '@/components/admin/properties-table';
import { LogoutButton } from '@/components/admin/logout-button';

export default async function AdminPropertiesPage({
  searchParams
}: {
  searchParams: { created?: string; updated?: string; deleted?: string };
}) {
  const properties = await readProperties();
  const banner = searchParams.created
    ? 'Property added.'
    : searchParams.updated
      ? 'Property saved.'
      : searchParams.deleted
        ? 'Property deleted.'
        : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]">
            <span>Properties</span>
            <Link href="/goldenadmin2026/rental-desk" className="text-white/40 transition hover:text-[#D9B355]">
              Rental Desk
            </Link>
          </div>
          <h1 className="mt-2 text-2xl font-medium uppercase tracking-[0.1em] text-white">
            Properties
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/goldenadmin2026/properties/new"
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

      {banner ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(217,179,85,0.3)] bg-[rgba(217,179,85,0.1)] px-4 py-3 text-sm text-[#D9B355]">
          {banner}
        </div>
      ) : null}

      <div className="mt-8">
        <PropertiesTable properties={properties} />
      </div>
    </div>
  );
}
