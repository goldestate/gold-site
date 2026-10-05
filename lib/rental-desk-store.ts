import { supabase, RENTAL_PHOTOS_BUCKET } from './supabase';
import { ndaFilePathsFor, removeNdaFiles } from './nda-store';
import type { FollowUpAudience, FollowUpSubject } from './follow-up-emails';
import type { LocationValue } from './property-taxonomy';
import type { RentalListingStatusValue, RentalPeriodValue, RentalPropertyTypeValue } from './rental-taxonomy';

export type BrokerInput = {
  name: string;
  phone: string;
  company?: string;
  whatsapp?: string;
  email?: string;
};

export type Broker = {
  id: string;
  name: string;
  company: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  status: 'guest' | 'registered' | 'verified';
  createdAt: string;
};

type BrokerRow = {
  id: string;
  name: string;
  company: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  status: string;
  created_at: string;
};

function rowToBroker(row: BrokerRow): Broker {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    status: row.status === 'registered' || row.status === 'verified' ? row.status : 'guest',
    createdAt: row.created_at
  };
}

/** Guest brokers submit requests without registering, so repeat submissions are matched by phone number. */
export async function upsertBrokerByPhone(input: BrokerInput): Promise<Broker> {
  const { data, error } = await supabase
    .from('brokers')
    .upsert(
      {
        phone: input.phone,
        name: input.name,
        company: input.company?.trim() || null,
        whatsapp: input.whatsapp?.trim() || null,
        email: input.email?.trim() || null
      },
      { onConflict: 'phone' }
    )
    .select('*')
    .single();
  if (error) throw error;
  return rowToBroker(data as BrokerRow);
}

export type RentalRequestInput = {
  propertyType: RentalPropertyTypeValue;
  location: LocationValue;
  budgetMin?: number;
  budgetMax?: number;
  bedrooms?: number;
  furnished?: boolean;
  moveInDate?: string;
  rentalPeriod?: RentalPeriodValue;
  notes?: string;
};

export type RentalRequest = {
  id: string;
  brokerId: string;
  propertyType: RentalPropertyTypeValue;
  location: LocationValue;
  budgetMin: number | null;
  budgetMax: number | null;
  bedrooms: number | null;
  furnished: boolean | null;
  moveInDate: string | null;
  rentalPeriod: RentalPeriodValue | null;
  notes: string | null;
  status: string;
  referenceCode: string;
  createdAt: string;
};

type RentalRequestRow = {
  id: string;
  broker_id: string;
  property_type: string;
  location: string;
  budget_min: number | null;
  budget_max: number | null;
  bedrooms: number | null;
  furnished: boolean | null;
  move_in_date: string | null;
  rental_period: string | null;
  notes: string | null;
  status: string;
  reference_code: string;
  created_at: string;
};

function rowToRentalRequest(row: RentalRequestRow): RentalRequest {
  return {
    id: row.id,
    brokerId: row.broker_id,
    propertyType: row.property_type as RentalPropertyTypeValue,
    location: row.location as LocationValue,
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    bedrooms: row.bedrooms,
    furnished: row.furnished,
    moveInDate: row.move_in_date,
    rentalPeriod: row.rental_period as RentalPeriodValue | null,
    notes: row.notes,
    status: row.status,
    referenceCode: row.reference_code,
    createdAt: row.created_at
  };
}

export async function createRentalRequest(brokerId: string, input: RentalRequestInput): Promise<RentalRequest> {
  const { data, error } = await supabase
    .from('rental_requests')
    .insert({
      broker_id: brokerId,
      property_type: input.propertyType,
      location: input.location,
      budget_min: input.budgetMin ?? null,
      budget_max: input.budgetMax ?? null,
      bedrooms: input.bedrooms ?? null,
      furnished: input.furnished ?? null,
      move_in_date: input.moveInDate || null,
      rental_period: input.rentalPeriod ?? null,
      notes: input.notes?.trim() || null
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToRentalRequest(data as RentalRequestRow);
}

export type OwnerInput = {
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
};

export type Owner = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  createdAt: string;
};

type OwnerRow = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  created_at: string;
};

function rowToOwner(row: OwnerRow): Owner {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    createdAt: row.created_at
  };
}

/** Owners list rentals without registering, so repeat submissions are matched by phone number. */
export async function upsertOwnerByPhone(input: OwnerInput): Promise<Owner> {
  const { data, error } = await supabase
    .from('owners')
    .upsert(
      {
        phone: input.phone,
        name: input.name,
        whatsapp: input.whatsapp?.trim() || null,
        email: input.email?.trim() || null
      },
      { onConflict: 'phone' }
    )
    .select('*')
    .single();
  if (error) throw error;
  return rowToOwner(data as OwnerRow);
}

export type RentalListingInput = {
  propertyType: RentalPropertyTypeValue;
  location: LocationValue;
  price: number;
  bedrooms?: number;
  furnished?: boolean;
  availableFrom?: string;
  photos: string[];
};

export type RentalListing = {
  id: string;
  ownerId: string;
  propertyType: RentalPropertyTypeValue;
  location: LocationValue;
  price: number;
  bedrooms: number | null;
  furnished: boolean | null;
  availableFrom: string | null;
  photos: string[];
  status: string;
  /** Set when this listing is a mirror of one of GOLD's own units in `properties`, not a third-party submission. */
  sourcePropertyId: string | null;
  createdAt: string;
};

type RentalListingRow = {
  id: string;
  owner_id: string;
  property_type: string;
  location: string;
  price: number;
  bedrooms: number | null;
  furnished: boolean | null;
  available_from: string | null;
  photos: unknown;
  status: string;
  source_property_id: string | null;
  created_at: string;
};

function rowToRentalListing(row: RentalListingRow): RentalListing {
  return {
    id: row.id,
    ownerId: row.owner_id,
    propertyType: row.property_type as RentalPropertyTypeValue,
    location: row.location as LocationValue,
    price: row.price,
    bedrooms: row.bedrooms,
    furnished: row.furnished,
    availableFrom: row.available_from,
    photos: Array.isArray(row.photos) ? row.photos.filter((item): item is string => typeof item === 'string') : [],
    status: row.status,
    sourcePropertyId: row.source_property_id,
    createdAt: row.created_at
  };
}

export async function createRentalListing(ownerId: string, input: RentalListingInput): Promise<RentalListing> {
  const { data, error } = await supabase
    .from('rental_listings')
    .insert({
      owner_id: ownerId,
      property_type: input.propertyType,
      location: input.location,
      price: input.price,
      bedrooms: input.bedrooms ?? null,
      furnished: input.furnished ?? null,
      available_from: input.availableFrom || null,
      photos: input.photos
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToRentalListing(data as RentalListingRow);
}

// ---------------------------------------------------------------------------
// Admin (Phase 4): reading requests/listings with their contact info attached,
// and the two admin actions (approve/change a listing's status, mark a match
// as sent to the broker).
// ---------------------------------------------------------------------------

export type RentalRequestWithBroker = RentalRequest & {
  broker: { name: string; phone: string; company: string | null; email: string | null };
};

type RentalRequestRowWithBroker = RentalRequestRow & {
  brokers: { name: string; phone: string; company: string | null; email: string | null } | null;
};

export async function listRentalRequests(): Promise<RentalRequestWithBroker[]> {
  const { data, error } = await supabase
    .from('rental_requests')
    .select('*, brokers(name, phone, company, email)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as RentalRequestRowWithBroker[]).map((row) => ({
    ...rowToRentalRequest(row),
    broker: {
      name: row.brokers?.name ?? 'Unknown',
      phone: row.brokers?.phone ?? '',
      company: row.brokers?.company ?? null,
      email: row.brokers?.email ?? null
    }
  }));
}

export type RentalListingWithOwner = RentalListing & {
  owner: { name: string; phone: string; email: string | null };
};

type RentalListingRowWithOwner = RentalListingRow & {
  owners: { name: string; phone: string; email: string | null } | null;
};

export async function listRentalListings(): Promise<RentalListingWithOwner[]> {
  const { data, error } = await supabase
    .from('rental_listings')
    .select('*, owners(name, phone, email)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as RentalListingRowWithOwner[]).map((row) => ({
    ...rowToRentalListing(row),
    owner: {
      name: row.owners?.name ?? 'Unknown',
      phone: row.owners?.phone ?? '',
      email: row.owners?.email ?? null
    }
  }));
}

export async function updateRentalListingStatus(
  id: string,
  status: RentalListingStatusValue
): Promise<RentalListing | null> {
  const { data, error } = await supabase
    .from('rental_listings')
    .update({ status })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data ? rowToRentalListing(data as RentalListingRow) : null;
}

export type Match = {
  id: string;
  requestId: string;
  listingId: string;
  matchScore: number;
  sentToBroker: boolean;
  sentAt: string | null;
  brokerResponse: string | null;
  createdAt: string;
};

type MatchRow = {
  id: string;
  request_id: string;
  listing_id: string;
  match_score: number;
  sent_to_broker: boolean;
  sent_at: string | null;
  broker_response: string | null;
  created_at: string;
};

function rowToMatch(row: MatchRow): Match {
  return {
    id: row.id,
    requestId: row.request_id,
    listingId: row.listing_id,
    matchScore: row.match_score,
    sentToBroker: row.sent_to_broker,
    sentAt: row.sent_at,
    brokerResponse: row.broker_response,
    createdAt: row.created_at
  };
}

export type MatchWithListing = Match & { listing: RentalListingWithOwner };

type MatchRowWithListing = MatchRow & { rental_listings: RentalListingRowWithOwner };

/** All matches, newest listing data attached, best score first — the page groups these by request. */
export async function listMatchesWithListings(): Promise<MatchWithListing[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*, rental_listings(*, owners(name, phone, email))')
    .order('match_score', { ascending: false });
  if (error) throw error;
  return (data as MatchRowWithListing[]).map((row) => ({
    ...rowToMatch(row),
    listing: {
      ...rowToRentalListing(row.rental_listings),
      owner: {
        name: row.rental_listings.owners?.name ?? 'Unknown',
        phone: row.rental_listings.owners?.phone ?? '',
        email: row.rental_listings.owners?.email ?? null
      }
    }
  }));
}

export type MatchSentResult = {
  match: Match;
  brokerName: string;
  brokerPhone: string;
  brokerWhatsapp: string | null;
  referenceCode: string;
};

type MatchRowWithRequest = MatchRow & {
  rental_requests:
    | {
        id: string;
        status: string;
        reference_code: string;
        brokers: { name: string; phone: string; whatsapp: string | null } | null;
      }
    | null;
};

/** Marks a match sent and, if its request was just waiting on this, bumps the request to 'matches_sent'. */
export async function markMatchSent(id: string): Promise<MatchSentResult | null> {
  const { data, error } = await supabase
    .from('matches')
    .update({ sent_to_broker: true, sent_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, rental_requests(id, status, reference_code, brokers(name, phone, whatsapp))')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as MatchRowWithRequest;
  const request = row.rental_requests;

  if (request && request.status === 'matching') {
    await supabase.from('rental_requests').update({ status: 'matches_sent' }).eq('id', request.id).eq('status', 'matching');
  }

  return {
    match: rowToMatch(row),
    brokerName: request?.brokers?.name ?? 'Unknown',
    brokerPhone: request?.brokers?.phone ?? '',
    brokerWhatsapp: request?.brokers?.whatsapp ?? null,
    referenceCode: request?.reference_code ?? ''
  };
}

// ---------------------------------------------------------------------------
// Deleting, and emailing the people staff tick.
// ---------------------------------------------------------------------------

/** A row id as Postgres makes them. Anything else can't be one, so it's "not found" without a query. */
export function isRowId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Deletes a request for good, with its matches, its agreement and the signed
 * file. The broker's contact stays: the next request from the same phone finds
 * them again. Returns false when there was nothing to delete.
 */
export async function deleteRentalRequest(id: string): Promise<boolean> {
  const { data, error } = await supabase.from('rental_requests').select('id').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return false;

  const signedFiles = await ndaFilePathsFor({ rentalRequestId: id });
  // matches has no ON DELETE CASCADE, so the request can't go while they point at it.
  const matches = await supabase.from('matches').delete().eq('request_id', id);
  if (matches.error) throw matches.error;
  const removed = await supabase.from('rental_requests').delete().eq('id', id);
  if (removed.error) throw removed.error;

  // Files last, once nothing on record points at them any more.
  await removeNdaFiles(signedFiles);
  return true;
}

export type DeleteListingResult = 'deleted' | 'not_found' | 'in_house';

/**
 * Deletes an owner's listing for good, with its matches, its agreement, the
 * signed file and its photos. GOLD's own units are refused: they mirror
 * Properties, come back on the next edit there, and their photos are the
 * property's.
 */
export async function deleteRentalListing(id: string): Promise<DeleteListingResult> {
  const { data, error } = await supabase
    .from('rental_listings')
    .select('id, photos, source_property_id')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return 'not_found';
  const row = data as { photos: unknown; source_property_id: string | null };
  if (row.source_property_id) return 'in_house';

  const signedFiles = await ndaFilePathsFor({ rentalListingId: id });
  const matches = await supabase.from('matches').delete().eq('listing_id', id);
  if (matches.error) throw matches.error;
  const removed = await supabase.from('rental_listings').delete().eq('id', id);
  if (removed.error) throw removed.error;

  await removeNdaFiles(signedFiles);
  await removeUnusedRentalPhotos(Array.isArray(row.photos) ? row.photos : []);
  return 'deleted';
}

/** The file name inside rental-photos behind one of its public URLs, or null for any other link. */
function rentalPhotoPath(url: string): string | null {
  const marker = `/storage/v1/object/public/${RENTAL_PHOTOS_BUCKET}/`;
  const at = url.indexOf(marker);
  if (at === -1) return null;
  let path: string;
  try {
    path = decodeURIComponent(url.slice(at + marker.length).split(/[?#]/)[0]);
  } catch {
    return null;
  }
  return path && !path.includes('..') && !path.includes('/') ? path : null;
}

/**
 * Removes a deleted listing's uploads. The form takes photo links as free text,
 * so a link another listing also uses is left alone. (photos is jsonb: the
 * filter has to be JSON, which supabase-js only sends for a string.)
 */
async function removeUnusedRentalPhotos(photos: unknown[]): Promise<void> {
  const paths: string[] = [];
  for (const url of photos) {
    if (typeof url !== 'string') continue;
    const path = rentalPhotoPath(url);
    if (!path) continue;
    const { data, error } = await supabase.from('rental_listings').select('id').contains('photos', JSON.stringify([url])).limit(1);
    if (error) {
      console.error('Could not check whether a rental photo is still in use', error);
      continue;
    }
    if ((data ?? []).length === 0) paths.push(path);
  }
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(RENTAL_PHOTOS_BUCKET).remove(paths);
  if (error) console.error('Could not remove rental photos', error);
}

export type FollowUpRecipient = FollowUpSubject & { id: string; email: string | null };

type RecipientRow = {
  id: string;
  property_type: string;
  location: string;
  reference_code?: string;
  source_property_id?: string | null;
  owners?: { name: string; email: string | null } | null;
  brokers?: { name: string; email: string | null } | null;
};

/**
 * The people behind the rows staff ticked, read fresh. The browser sends only
 * ids, so nothing can be emailed that isn't on file. In-house listings have no
 * outside owner and are left out. In the order the ids came.
 */
export async function readFollowUpRecipients(audience: FollowUpAudience, ids: string[]): Promise<FollowUpRecipient[]> {
  const { data, error } =
    audience === 'owners'
      ? await supabase
          .from('rental_listings')
          .select('id, property_type, location, source_property_id, owners(name, email)')
          .in('id', ids)
      : await supabase
          .from('rental_requests')
          .select('id, property_type, location, reference_code, brokers(name, email)')
          .in('id', ids);
  if (error) throw error;

  const rows = (data ?? []) as unknown as RecipientRow[];
  const order = new Map(ids.map((id, index) => [id, index]));
  return rows
    .filter((row) => !row.source_property_id)
    .map((row) => {
      const person = audience === 'owners' ? row.owners : row.brokers;
      return {
        id: row.id,
        name: person?.name ?? '',
        email: person?.email ?? null,
        propertyType: row.property_type as RentalPropertyTypeValue,
        location: row.location as LocationValue,
        referenceCode: row.reference_code
      };
    })
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
