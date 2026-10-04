import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientKey } from '@/lib/rate-limit';
import { upsertOwnerByPhone, createRentalListing } from '@/lib/rental-desk-store';
import { isLocation, type LocationValue } from '@/lib/property-taxonomy';
import { isRentalPropertyType, type RentalPropertyTypeValue } from '@/lib/rental-taxonomy';
import { openNdaFor } from '@/lib/nda-store';
import { adminEmailAddress, isEmailShaped, sendEmail } from '@/lib/email';
import { adminSubmissionEmail, listingReceivedEmail } from '@/lib/email-templates';

type ListPropertyPayload = {
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  propertyType: RentalPropertyTypeValue;
  location: LocationValue;
  price: number;
  bedrooms?: number;
  furnished?: boolean;
  availableFrom?: string;
  photos: string[];
  /** The language the form was filled in. The app doesn't send it yet. */
  locale?: 'en' | 'ar';
};

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isOptionalFiniteNumber = (value: unknown) =>
  value === undefined || (typeof value === 'number' && Number.isFinite(value));

function isValidBody(body: unknown): body is ListPropertyPayload {
  if (!body || typeof body !== 'object') return false;
  const value = body as Record<string, unknown>;
  return (
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.phone) &&
    (value.whatsapp === undefined || typeof value.whatsapp === 'string') &&
    (value.email === undefined || typeof value.email === 'string') &&
    isRentalPropertyType(value.propertyType) &&
    isLocation(value.location) &&
    typeof value.price === 'number' &&
    Number.isFinite(value.price) &&
    value.price >= 0 &&
    isOptionalFiniteNumber(value.bedrooms) &&
    (value.furnished === undefined || typeof value.furnished === 'boolean') &&
    (value.availableFrom === undefined || typeof value.availableFrom === 'string') &&
    Array.isArray(value.photos) &&
    value.photos.length > 0 &&
    value.photos.every((item) => typeof item === 'string' && item.trim().length > 0) &&
    (value.locale === undefined || value.locale === 'en' || value.locale === 'ar')
  );
}

export async function POST(request: NextRequest) {
  const clientKey = `list-property:${getClientKey(request)}`;
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
    const owner = await upsertOwnerByPhone({
      name: body.name.trim(),
      phone: body.phone.trim(),
      whatsapp: body.whatsapp,
      email: body.email
    });

    const listing = await createRentalListing(owner.id, {
      propertyType: body.propertyType,
      location: body.location,
      price: body.price,
      bedrooms: body.bedrooms,
      furnished: body.furnished,
      availableFrom: body.availableFrom,
      photos: body.photos.map((url) => url.trim())
    });

    const email = isEmailShaped(body.email) ? body.email.trim() : null;
    const nda = await openNdaFor(
      { rentalListingId: listing.id },
      { name: owner.name, company: '', phone: owner.phone ?? body.phone.trim(), email: email ?? '' }
    );

    // After the response, not before it: a slow or failing email must not hold
    // up or fail a listing that is already saved.
    const lang = body.locale ?? 'en';
    if (email) {
      void sendEmail(
        listingReceivedEmail({
          to: email,
          lang,
          name: owner.name,
          propertyType: body.propertyType,
          location: body.location,
          ndaToken: nda?.token ?? null
        })
      );
    }
    const admin = adminEmailAddress();
    if (admin) {
      void sendEmail(
        adminSubmissionEmail({
          to: admin,
          kind: 'listing',
          name: owner.name,
          phone: owner.phone ?? body.phone.trim(),
          email,
          propertyType: body.propertyType,
          location: body.location
        })
      );
    }

    // ndaToken opens the signing page. Absent before migration 007; the form
    // then shows its usual thank-you instead.
    return NextResponse.json({ id: listing.id, ndaToken: nda?.token ?? null }, { status: 201 });
  } catch (error) {
    console.error('Failed to create rental listing', error);
    return NextResponse.json({ error: 'Could not submit your listing. Please try again.' }, { status: 500 });
  }
}
