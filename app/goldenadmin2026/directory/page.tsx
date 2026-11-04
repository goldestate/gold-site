import { readDirectorySummary, readListingNames } from '@/lib/directory-store';
import { COVERAGE_CATEGORIES, isCoverageCategory } from '@/lib/directory-taxonomy';
import { LogoutButton } from '@/components/admin/logout-button';
import { AdminNav } from '@/components/admin/admin-nav';
import { fillMissingPins } from '@/lib/compound-pins';
import { NewCompoundForm } from '@/components/admin/new-compound-form';
import { CompoundSuggestions } from '@/components/admin/compound-suggestions';
import { deriveCompoundSuggestions, type CompoundSuggestion } from '@/lib/compound-suggestions';
import { DirectoryList, type DirectoryListItem } from '@/components/admin/directory-list';

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

  // Compounds with no map location are looked up on OpenStreetMap in the
  // background; their pins are there on the next load. Nothing here waits.
  fillMissingPins(rows.map((row) => row.compound));

  // Emergency and Other are not counted: the app ships the national emergency
  // numbers already, and "Other" is a catch-all, so neither is a gap.
  const total = COVERAGE_CATEGORIES.length;

  // Only what the list shows and filters on goes to the browser.
  const items: DirectoryListItem[] = rows.map(({ compound, filledCategories, liveCodes, unlocked, placeCount }) => ({
    id: compound.id,
    slug: compound.slug,
    nameEn: compound.nameEn,
    nameAr: compound.nameAr,
    matchNames: compound.matchNames,
    location: compound.location,
    active: compound.active,
    hasPin: Boolean(compound.pin),
    placeCount,
    filled: filledCategories.filter(isCoverageCategory).length,
    liveCodes,
    unlocked
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <AdminNav current="directory" />
          <h1 className="mt-2 text-2xl font-medium uppercase tracking-[0.1em] text-white">Neighbourhood</h1>
        </div>
        <LogoutButton />
      </div>

      <p className="mt-4 text-sm text-white/55">
        The places guests need near each compound. Tap a compound to add or edit its list.
      </p>

      <DirectoryList items={items} total={total} />

      <CompoundSuggestions suggestions={suggestions} />

      <NewCompoundForm />
    </div>
  );
}
