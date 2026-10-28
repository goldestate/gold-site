import Link from 'next/link';
import { readProperties } from '@/lib/properties-store';
import { readPhotoUploadDays, readPropertyDeletions } from '@/lib/unit-activity';
import { cairoToday } from '@/lib/cairo-time';
import { UnitsDashboard } from '@/components/admin/units-dashboard';
import { AdminNav } from '@/components/admin/admin-nav';
import { LogoutButton } from '@/components/admin/logout-button';

export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage({
  searchParams
}: {
  searchParams: { created?: string; updated?: string; deleted?: string; restored?: string };
}) {
  const [properties, deletions] = await Promise.all([
    readProperties(),
    // Optional: before migration 008 there is no record, and the page leaves
    // the "Deleted units" section out rather than failing.
    readPropertyDeletions().catch((error) => {
      console.error('Could not read the deleted units', error);
      return null;
    })
  ]);
  // Optional too: without it the chart shows units only.
  const photoDays = await readPhotoUploadDays(properties, deletions).catch((error) => {
    console.error('Could not read the photo uploads', error);
    return null;
  });

  const banner = searchParams.created
    ? 'Property added.'
    : searchParams.updated
      ? 'Property saved.'
      : searchParams.deleted
        ? 'Property deleted.'
        : searchParams.restored
          ? 'Property restored.'
          : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <AdminNav current="properties" />
          <h1 className="mt-2 text-2xl font-medium uppercase tracking-[0.1em] text-white">Properties</h1>
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
        Published units show on the website and in the app. Hidden units only show here. Days are counted in Cairo
        time.
      </p>

      {banner ? (
        <div className="mt-6 rounded-[1rem] border border-[rgba(217,179,85,0.3)] bg-[rgba(217,179,85,0.1)] px-4 py-3 text-sm text-[#D9B355]">
          {banner}
        </div>
      ) : null}

      <div className="mt-8">
        <UnitsDashboard properties={properties} photoDays={photoDays} deletions={deletions} today={cairoToday()} />
      </div>
    </div>
  );
}
