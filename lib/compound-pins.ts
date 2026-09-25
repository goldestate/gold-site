import { findCompoundPin } from './geocode';
import { isMissingPinColumns, setAutoPin, updateCompound, type Compound } from './directory-store';

/**
 * Keeps every compound on the map without anyone pinning it.
 *
 * Server-only. Compounds without a pin are looked up on OpenStreetMap in the
 * background whenever the directory admin is opened, a compound is added, or
 * one is renamed. Nothing waits for it: the lookups take about a second each,
 * the pins appear on the next page load, and the app picks them up the next
 * time it fetches the compound list.
 *
 * State lives in this process only. A deploy forgets which compounds weren't
 * found and tries them once more, which costs a second each.
 */

/** A compound OpenStreetMap doesn't know is asked about again after this. */
const NOT_FOUND_RETRY_MS = 24 * 60 * 60 * 1000;

const notFoundAt = new Map<string, number>();
let running: Promise<void> | null = null;
/** Set when the database has no pin columns yet (migration 006 not run). */
let columnsMissing = false;

export type LookupResult = 'found' | 'not-found' | 'failed' | 'no-columns' | 'kept-staff-pin';

/**
 * Looks one compound up and stores what it finds. `force` replaces a pin staff
 * placed by hand, and is only used when staff ask for the lookup themselves.
 */
export async function lookUpCompoundPin(compound: Compound, force = false): Promise<LookupResult> {
  let pin;
  try {
    pin = await findCompoundPin(compound);
  } catch (error) {
    console.error(`Could not look up ${compound.nameEn} on OpenStreetMap`, error);
    return 'failed';
  }
  if (!pin) {
    notFoundAt.set(compound.id, Date.now());
    return 'not-found';
  }
  notFoundAt.delete(compound.id);
  try {
    if (force) {
      await updateCompound(compound.id, { pin, pinSource: 'auto' });
      return 'found';
    }
    return (await setAutoPin(compound.id, pin)) ? 'found' : 'kept-staff-pin';
  } catch (error) {
    if (isMissingPinColumns(error)) {
      columnsMissing = true;
      return 'no-columns';
    }
    console.error(`Could not save the pin for ${compound.nameEn}`, error);
    return 'failed';
  }
}

/**
 * Starts filling in every compound that has no pin, and returns at once. One
 * run at a time; a second call while one is going is ignored, since it would
 * look up the same compounds.
 */
export function fillMissingPins(compounds: Compound[]): void {
  if (running || columnsMissing) return;
  const now = Date.now();
  const todo = compounds.filter((compound) => {
    if (compound.pin) return false;
    const missedAt = notFoundAt.get(compound.id);
    return missedAt === undefined || now - missedAt > NOT_FOUND_RETRY_MS;
  });
  if (todo.length === 0) return;

  running = (async () => {
    for (const compound of todo) {
      const result = await lookUpCompoundPin(compound);
      // Without the columns every save fails the same way; stop asking the map.
      if (result === 'no-columns') break;
    }
  })()
    .catch((error) => console.error('Filling compound pins failed', error))
    .finally(() => {
      running = null;
    });
}

/**
 * After a rename or a change of region: a pin the site found under the old name
 * is looked up again under the new one. Kept when the new name finds nothing --
 * a spelling fix doesn't move a compound -- and a pin staff placed is never touched.
 */
export function refreshAutoPin(compound: Compound): void {
  if (columnsMissing || compound.pinSource === 'staff') return;
  notFoundAt.delete(compound.id);
  void lookUpCompoundPin(compound).catch((error) => console.error('Refreshing a compound pin failed', error));
}
