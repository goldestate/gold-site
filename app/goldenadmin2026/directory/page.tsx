import Link from 'next/link';
import { readCompounds, readAllPlaces, readLiveCodes } from '@/lib/directory-store';
import { PLACE_CATEGORIES } from '@/lib/directory-taxonomy';
import { LogoutButton } from '@/components/admin/logout-button';
import { NewCompoundForm } from '@/components/admin/new-compound-form';
import { CompoundSuggestions } from '@/components/admin/compound-suggestions';
import { readProperties } from '@/lib/properties-store';
import { deriveCompoundSuggestions } from '@/lib/compound-suggestions';

export const dynamic = 'force-dynamic';

export default async function DirectoryPage() {
  const compounds = await readCompounds(true);
  // Derived here rather than fetched: this page is already a server component,
  // and the listings it reads are the same ones the properties admin shows.
  const properties = await readProperties();
  const suggestions = deriveCompoundSuggestions(properties, new Set(compounds.map((item) => item.slug)));
  const rows = await Promise.all(
    compounds.map(async (compound) => {
      const [places, codes] = await Promise.all([readAllPlaces(compound.id), readLiveCodes(compound.id)]);
      const filled = new Set(places.filter((place) => place.active).map((place) => place.category));
      const unlocked = codes.reduce((sum, code) => sum + code.redemptionCount, 0);
      return {
        compound,
        filled: filled.size,
        total: PLACE_CATEGORIES.length,
        liveCodes: codes.length,
        unlocked,
        places: places.length
      };
    })
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-4 font-serif text-xs uppercase tracking-[0.4em] text-[rgba(217,179,85,0.9)]">
            <Link href="/goldenadmin2026/properties" className="text-white/40 transition hover:text-[#D9B355]">
              Properties
            </Link>
            <Link href="/goldenadmin2026/rental-desk" className="text-white/40 transition hover:text-[#D9B355]">
              Rental Desk
            </Link>
            <span>Directory</span>
          </div>
          <h1 className="mt-2 text-2xl font-medium uppercase tracking-[0.1em] text-white">Neighbourhood</h1>
        </div>
        <LogoutButton />
      </div>

      <p className="mt-4 text-sm text-white/55">
        The places guests need near each compound. Tap a compound to add or edit its list.
      </p>

      <div className="mt-6 space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/50">
            No compounds yet. Add your first one below.
          </p>
        ) : null}

        {rows.map(({ compound, filled, total, liveCodes, unlocked, places }) => {
          const percent = Math.round((filled / total) * 100);
          return (
            <Link
              key={compound.id}
              href={`/goldenadmin2026/directory/${compound.slug}`}
              className="block rounded-[1rem] border border-white/12 bg-white/5 p-4 transition active:scale-[0.99] hover:border-[rgba(217,179,85,0.45)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-medium text-white">{compound.nameEn}</div>
                  <div className="mt-0.5 text-xs uppercase tracking-[0.16em] text-white/40">
                    {places} {places === 1 ? 'entry' : 'entries'}
                  </div>
                </div>
                <div className="flex-none text-right">
                  <div className="text-sm text-[#D9B355]">
                    {liveCodes > 0 ? `${liveCodes} live ${liveCodes === 1 ? 'code' : 'codes'}` : 'No codes'}
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/40">
                    {liveCodes > 0 ? `${unlocked} unlocked` : 'not set up'}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-white/50">
                  <span>
                    {filled} of {total} categories
                  </span>
                  <span>{percent}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#D9B355] transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <CompoundSuggestions suggestions={suggestions} />

      <NewCompoundForm />
    </div>
  );
}
