import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientKey } from '@/lib/rate-limit';
import { upsertBrokerByPhone, createRentalRequest } from '@/lib/rental-desk-store';
import { isLocation, type LocationValue } from '@/lib/property-taxonomy';
import { isRentalPeriod, isRentalPropertyType, type RentalPeriodValue, type RentalPropertyTypeValue } from '@/lib/rental-taxonomy';

type RentalRequestPayload = {
  name: string;
  phone: string;
  company?: string;
  whatsapp?: string;
  email?: string;
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

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isOptionalFiniteNumber = (value: unknown) =>
  value === undefined || (typeof value === 'number' && Number.isFinite(value));

function isValidBody(body: unknown): body is RentalRequestPayload {
  if (!body || typeof body !== 'object') return false;
  const value = body as Record<string, unknown>;
  return (
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.phone) &&
    (value.company === undefined || typeof value.company === 'string') &&
    (value.whatsapp === undefined || typeof value.whatsapp === 'string') &&
    (value.email === undefined || typeof value.email === 'string') &&
    isRentalPropertyType(value.propertyType) &&
    isLocation(value.location) &&
    isOptionalFiniteNumber(value.budgetMin) &&
    isOptionalFiniteNumber(value.budgetMax) &&
    isOptionalFiniteNumber(value.bedrooms) &&
    (value.furnished === undefined || typeof value.furnished === 'boolean') &&
    (value.moveInDate === undefined || typeof value.moveInDate === 'string') &&
    (value.rentalPeriod === undefined || isRentalPeriod(value.rentalPeriod)) &&
    (value.notes === undefined || typeof value.notes === 'string')
  );
}

export async function POST(request: NextRequest) {
  const clientKey = `rental-request:${getClientKey(request)}`;
  const rateLimit = checkRateLimit(clientKey);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many submissions. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json({ error: 'Missing or invalid fields.' }, { status: 400 });
  }

  if (!/^[+()0-9\s-]{7,}$/.test(body.phone.trim())) {
    return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
  }

  try {
    const broker = await upsertBrokerByPhone({
      name: body.name.trim(),
      phone: body.phone.trim(),
      company: body.company,
      whatsapp: body.whatsapp,
      email: body.email
    });

    const rentalRequest = await createRentalRequest(broker.id, {
      propertyType: body.propertyType,
      location: body.location,
      budgetMin: body.budgetMin,
      budgetMax: body.budgetMax,
      bedrooms: body.bedrooms,
      furnished: body.furnished,
      moveInDate: body.moveInDate,
      rentalPeriod: body.rentalPeriod,
      notes: body.notes
    });

    return NextResponse.json({ referenceCode: rentalRequest.referenceCode }, { status: 201 });
  } catch (error) {
    console.error('Failed to create rental request', error);
    return NextResponse.json({ error: 'Could not submit your request. Please try again.' }, { status: 500 });
  }
}
