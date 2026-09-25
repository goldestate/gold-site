import { slugifyCompound } from './directory-taxonomy';
import type { LocationValue } from './property-taxonomy';

/**
 * Turns the compounds GOLD has already been selling into directory compounds.
 *
 * Every compound in the directory also exists in the listings: staff typed
 * "Hacienda bay - Chalet" months ago, and typing "Hacienda Bay" again into the
 * directory form is the same knowledge entered twice. This derives the second
 * from the first.
 *
 * It reads listings and writes nothing to them. The listing names are what
 * staff entered and are treated as correct: names are never rewritten, and two
 * names that differ are never merged. "Mountain View 1" and "Mountain View" are
 * different compounds in different regions and stay that way; if GOLD ever
 * wants two names to share one directory, that is an explicit edit to the
 * compound's match names, not something inferred here -- and once made, it is
 * respected: a name in any compound's match names is never suggested again.
 */

/**
 * Listing names follow "Compound - Unit type". Split on the first dash whatever
 * the spacing, because live data holds both "Il Monte Galala - Chalet" and
 * "Il Monte Galala- Chalet"; requiring " - " turns one compound into two. No
 * compound name in the catalogue contains a dash, so the first one is always
 * the separator. This mirrors `Property.compound` in the iOS app -- the two must
 * agree or a compound the app can match is one the admin panel never offers.
 */
export function compoundFromListingName(name: string): string {
  const dash = name.indexOf('-');
  if (dash === -1) return name.trim();
  const head = name.slice(0, dash).trim();
  return head || name.trim();
}

export type CompoundSuggestion = {
  slug: string;
  /** The spelling staff used most often. Editable before it is created. */
  nameEn: string;
  /** Every spelling seen, verbatim. These become the compound's match names. */
  variants: string[];
  location: LocationValue;
  /** Locations that disagree within one name -- worth a human look, not an error. */
  otherLocations: LocationValue[];
  listingCount: number;
  /** True when a compound in the directory already covers this name. */
  exists: boolean;
};

/** A listing, reduced to what suggestions read. A full Property fits too. */
export type ListingName = { name: string; location: LocationValue };

/** A directory compound, reduced to the names it answers to. */
export type KnownCompound = { slug: string; nameEn: string; matchNames: string[] };

/**
 * Every slug the directory already answers to: each compound's slug, its
 * English name and every one of its match names, compared slugified so
 * "Marassi Marina", "marassi marina" and "Marassi-Marina" are one name.
 *
 * Match names are what make this work. Staff map "Marassi Marina" onto Marassi
 * by adding it to Marassi's match names; a suggestion is also added with every
 * listing spelling as match names, including the original when staff renamed
 * it before adding. Checking only slugs, as this used to, offered all of those
 * again as new compounds on every visit -- and 'Add all' created them.
 */
export function coveredSlugs(compounds: KnownCompound[]): Set<string> {
  const covered = new Set<string>();
  for (const compound of compounds) {
    for (const name of [compound.slug, compound.nameEn, ...compound.matchNames]) {
      const slug = slugifyCompound(name);
      if (slug) covered.add(slug);
    }
  }
  return covered;
}

export function deriveCompoundSuggestions(
  properties: ListingName[],
  compounds: KnownCompound[]
): CompoundSuggestion[] {
  const covered = coveredSlugs(compounds);
  const groups = new Map<
    string,
    { spellings: Map<string, number>; locations: Map<LocationValue, number>; count: number }
  >();

  for (const property of properties) {
    const name = compoundFromListingName(property.name);
    if (!name) continue;
    const slug = slugifyCompound(name);
    if (!slug) continue;

    let group = groups.get(slug);
    if (!group) {
      group = { spellings: new Map(), locations: new Map(), count: 0 };
      groups.set(slug, group);
    }
    group.spellings.set(name, (group.spellings.get(name) ?? 0) + 1);
    group.locations.set(property.location, (group.locations.get(property.location) ?? 0) + 1);
    group.count += 1;
  }

  const byCountDesc = <T,>(entries: Iterable<[T, number]>): T[] =>
    [...entries].sort((a, b) => b[1] - a[1]).map(([value]) => value);

  return [...groups.entries()]
    .map(([slug, group]) => {
      const spellings = byCountDesc(group.spellings.entries());
      const locations = byCountDesc(group.locations.entries());
      return {
        slug,
        nameEn: spellings[0],
        variants: spellings,
        location: locations[0],
        otherLocations: locations.slice(1),
        listingCount: group.count,
        exists: covered.has(slug)
      };
    })
    // Most listings first: that is the order the directory is worth filling in.
    .sort((a, b) => b.listingCount - a.listingCount || a.nameEn.localeCompare(b.nameEn));
}
