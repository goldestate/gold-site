import Link from 'next/link';
import { readDirectorySummary, readListingNames } from '@/lib/directory-store';
import { COVERAGE_CATEGORIES, isCoverageCategory } from '@/lib/directory-taxonomy';
import { LogoutButton } from '@/components/admin/logout-button';
import { NewCompoundForm } from '@/components/admin/new-compound-form';
import { CompoundSuggestions } from '@/components/admin/compound-suggestions';
import { deriveCompoundSuggestions, type CompoundSuggestion } from '@/lib/compound-suggestions';

export const dynamic = 'force-dynamic';

export default async function DirectoryPage() {
  // Side by side: the listings read only feeds the suggestions, and it is
  // optional -- if it fails, staff still get their compound list, just without
  // "From your listings" underneath it.
  const [rows, listings] = await Promise.all([
    readDirectorySummary(),
    readListingNames().catch((error) => {
      console.error('Failed to read listings for compound suggestions', error);
      return null;
    })
  ]);

  // Derived here rather than fetched: this page is already a server component,
  // and the listings it reads are the same ones the properties admin shows.
  let suggestions: CompoundSuggestion[] = [];
  if (listings) {
    try {
      suggestions = deriveCompoundSuggestions(
        listings,
        rows.map((row) => row.compound)
      );
    } catch (error) {
      console.error('Failed to derive compound suggestions', error);
    }
  }

  // Emergency and Other are not counted: the app ships the national emergency
  // numbers already, and "Other" is a catch-all, so neither is a gap.
  const total = COVERAGE_CATEGORIES.length;

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

        {rows.map(({ compound, filledCategories, liveCodes, unlocked, placeCount }) => {
          const filled = filledCategories.filter(isCoverageCategory).length;
          const percent = total === 0 ? 0 : Math.round((filled / total) * 100);
          return (
            <Link
              key={compound.id}
              href={`/goldenadmin2026/directory/${compound.slug}`}
              className={`block rounded-[1rem] border border-white/12 bg-white/5 p-4 transition active:scale-[0.99] hover:border-[rgba(217,179,85,0.45)] ${
                compound.active ? '' : 'opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-medium text-white">{compound.nameEn}</div>
                  <div className="mt-0.5 text-xs uppercase tracking-[0.16em] text-white/40">
                    {placeCount} {placeCount === 1 ? 'entry' : 'entries'}
                    {compound.active ? null : <span className="ml-2 text-[#D9A441]">Hidden</span>}
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
