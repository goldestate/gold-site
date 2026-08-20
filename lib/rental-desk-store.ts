import { supabase } from './supabase';
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
  broker: { name: string; phone: string; company: string | null };
};

type RentalRequestRowWithBroker = RentalRequestRow & {
  brokers: { name: string; phone: string; company: string | null } | null;
};

export async function listRentalRequests(): Promise<RentalRequestWithBroker[]> {
  const { data, error } = await supabase
    .from('rental_requests')
    .select('*, brokers(name, phone, company)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as RentalRequestRowWithBroker[]).map((row) => ({
    ...rowToRentalRequest(row),
    broker: {
      name: row.brokers?.name ?? 'Unknown',
      phone: row.brokers?.phone ?? '',
      company: row.brokers?.company ?? null
    }
  }));
}

export type RentalListingWithOwner = RentalListing & {
  owner: { name: string; phone: string };
};

type RentalListingRowWithOwner = RentalListingRow & {
  owners: { name: string; phone: string } | null;
};

export async function listRentalListings(): Promise<RentalListingWithOwner[]> {
  const { data, error } = await supabase
    .from('rental_listings')
    .select('*, owners(name, phone)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as RentalListingRowWithOwner[]).map((row) => ({
    ...rowToRentalListing(row),
    owner: {
      name: row.owners?.name ?? 'Unknown',
      phone: row.owners?.phone ?? ''
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
    .select('*, rental_listings(*, owners(name, phone))')
    .order('match_score', { ascending: false });
  if (error) throw error;
  return (data as MatchRowWithListing[]).map((row) => ({
    ...rowToMatch(row),
    listing: {
      ...rowToRentalListing(row.rental_listings),
      owner: {
        name: row.rental_listings.owners?.name ?? 'Unknown',
        phone: row.rental_listings.owners?.phone ?? ''
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
