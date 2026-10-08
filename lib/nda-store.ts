import { randomBytes } from 'node:crypto';
import { supabase } from './supabase';
import { NDA_VERSION } from './nda';

/**
 * Server-only. Confidentiality agreements: one per "Request a unit" or "List your
 * property" submission, pending until the person signs it on the signing page.
 */

export const NDA_BUCKET = 'nda-files';

export type NdaStatus = 'pending' | 'signed';
export type NdaMethod = 'drawn' | 'uploaded';

export type NdaSigner = {
  name: string;
  company: string;
  phone: string;
  email: string;
};

export type NdaAgreement = {
  id: string;
  token: string;
  status: NdaStatus;
  agreementVersion: string;
  signer: NdaSigner;
  method: NdaMethod | null;
  filePath: string | null;
  signedAt: string | null;
  createdAt: string;
  rentalRequestId: string | null;
  rentalListingId: string | null;
};

type NdaRow = {
  id: string;
  token: string;
  status: string;
  agreement_version: string;
  signer_name: string;
  signer_company: string;
  signer_phone: string;
  signer_email: string;
  method: string | null;
  file_path: string | null;
  signed_at: string | null;
  created_at: string;
  rental_request_id: string | null;
  rental_listing_id: string | null;
};

function rowToNda(row: NdaRow): NdaAgreement {
  return {
    id: row.id,
    token: row.token,
    status: row.status === 'signed' ? 'signed' : 'pending',
    agreementVersion: row.agreement_version,
    signer: {
      name: row.signer_name,
      company: row.signer_company,
      phone: row.signer_phone,
      email: row.signer_email
    },
    method: row.method === 'drawn' || row.method === 'uploaded' ? row.method : null,
    filePath: row.file_path,
    signedAt: row.signed_at,
    createdAt: row.created_at,
    rentalRequestId: row.rental_request_id,
    rentalListingId: row.rental_listing_id
  };
}

/** 32 random bytes, URL-safe: the signing link can't be guessed or walked. */
function newToken(): string {
  return randomBytes(32).toString('base64url');
}

export function isNdaTokenShaped(value: string): boolean {
  return /^[A-Za-z0-9_-]{40,64}$/.test(value);
}

export async function createNdaAgreement(
  subject: { rentalRequestId: string } | { rentalListingId: string },
  signer: NdaSigner
): Promise<NdaAgreement> {
  const { data, error } = await supabase
    .from('nda_agreements')
    .insert({
      rental_request_id: 'rentalRequestId' in subject ? subject.rentalRequestId : null,
      rental_listing_id: 'rentalListingId' in subject ? subject.rentalListingId : null,
      token: newToken(),
      agreement_version: NDA_VERSION,
      signer_name: signer.name,
      signer_company: signer.company,
      signer_phone: signer.phone,
      signer_email: signer.email
    })
    .select()
    .single();
  if (error) throw error;
  return rowToNda(data as NdaRow);
}

/** The table isn't there yet: migration 007 not run. */
function isMissingTable(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return code === 'PGRST205' || code === '42P01';
}

/**
 * Opens the pending agreement for a new submission, or returns null when it
 * can't -- before migration 007, or if the database refuses. Never throws: the
 * submission itself has already been saved, and must not fail over this.
 */
export async function openNdaFor(
  subject: { rentalRequestId: string } | { rentalListingId: string },
  signer: NdaSigner
): Promise<NdaAgreement | null> {
  try {
    return await createNdaAgreement(subject, signer);
  } catch (error) {
    if (!isMissingTable(error)) console.error('Could not open the confidentiality agreement', error);
    return null;
  }
}

export async function getNdaByToken(token: string): Promise<NdaAgreement | null> {
  if (!isNdaTokenShaped(token)) return null;
  const { data, error } = await supabase.from('nda_agreements').select('*').eq('token', token).maybeSingle();
  if (error) throw error;
  return data ? rowToNda(data as NdaRow) : null;
}

export async function getNdaById(id: string): Promise<NdaAgreement | null> {
  const { data, error } = await supabase.from('nda_agreements').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? rowToNda(data as NdaRow) : null;
}

/**
 * Marks a pending agreement signed. Only a pending one: a link used once can't
 * replace a signature that is already on record. Returns null when the token is
 * unknown or already signed.
 */
export async function markNdaSigned(
  token: string,
  signed: { method: NdaMethod; filePath: string; signer?: NdaSigner }
): Promise<NdaAgreement | null> {
  const { data, error } = await supabase
    .from('nda_agreements')
    .update({
      status: 'signed',
      method: signed.method,
      file_path: signed.filePath,
      signed_at: new Date().toISOString(),
      // What they read on the page is what they signed, even if the row was
      // created under an earlier version of the text.
      agreement_version: NDA_VERSION,
      // The details as they typed them on the signing page: what the signed PDF shows.
      ...(signed.signer
        ? {
            signer_name: signed.signer.name,
            signer_company: signed.signer.company,
            signer_phone: signed.signer.phone,
            signer_email: signed.signer.email
          }
        : {})
    })
    .eq('token', token)
    .eq('status', 'pending')
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? rowToNda(data as NdaRow) : null;
}

/** Every agreement for the Rental Desk, keyed by the request or listing it belongs to. */
export async function readNdaIndex(): Promise<{
  byRequest: Record<string, NdaAgreement>;
  byListing: Record<string, NdaAgreement>;
}> {
  const byRequest: Record<string, NdaAgreement> = {};
  const byListing: Record<string, NdaAgreement> = {};
  const { data, error } = await supabase
    .from('nda_agreements')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  // Oldest first, so a later agreement for the same submission (a re-send)
  // is the one kept.
  for (const row of (data ?? []) as NdaRow[]) {
    const nda = rowToNda(row);
    if (nda.rentalRequestId) byRequest[nda.rentalRequestId] = nda;
    if (nda.rentalListingId) byListing[nda.rentalListingId] = nda;
  }
  return { byRequest, byListing };
}

/** What the submission was, for the top of the signing page and the admin. */
export async function readNdaSubject(
  nda: NdaAgreement
): Promise<{ kind: 'request'; referenceCode: string } | { kind: 'listing' } | null> {
  if (nda.rentalRequestId) {
    const { data, error } = await supabase
      .from('rental_requests')
      .select('reference_code')
      .eq('id', nda.rentalRequestId)
      .maybeSingle();
    if (error) throw error;
    return data ? { kind: 'request', referenceCode: String((data as { reference_code: string }).reference_code) } : null;
  }
  if (nda.rentalListingId) return { kind: 'listing' };
  return null;
}

export async function uploadNdaFile(path: string, body: Buffer, contentType: string): Promise<void> {
  const { error } = await supabase.storage.from(NDA_BUCKET).upload(path, body, { contentType, upsert: false });
  if (error) throw error;
}

/** A link that opens the private file for an hour, for the admin only. */
export async function ndaFileUrl(path: string, downloadName?: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(NDA_BUCKET)
    .createSignedUrl(path, 60 * 60, downloadName ? { download: downloadName } : undefined);
  if (error) {
    console.error('Could not sign the NDA file link', error);
    return null;
  }
  return data.signedUrl;
}

/** A stored signature or signed copy, as bytes. */
export async function downloadNdaFile(path: string): Promise<Uint8Array> {
  const { data, error } = await supabase.storage.from(NDA_BUCKET).download(path);
  if (error) throw error;
  return new Uint8Array(await data.arrayBuffer());
}

/**
 * Removes the stored files of a request's agreements, before the request (and,
 * with it, the agreement rows) is deleted. Best effort: a file left behind is
 * private and harmless, so this never stops the delete.
 */
export async function removeNdaFilesForRequest(rentalRequestId: string): Promise<void> {
  try {
    const { data, error } = await supabase.from('nda_agreements').select('id').eq('rental_request_id', rentalRequestId);
    if (error) throw error;
    for (const { id } of (data ?? []) as { id: string }[]) {
      const { data: files, error: listError } = await supabase.storage.from(NDA_BUCKET).list(id);
      if (listError) throw listError;
      const paths = (files ?? []).map((file) => `${id}/${file.name}`);
      if (paths.length > 0) {
        const { error: removeError } = await supabase.storage.from(NDA_BUCKET).remove(paths);
        if (removeError) throw removeError;
      }
    }
  } catch (error) {
    if (!isMissingTable(error)) console.error('Could not remove the agreement files', error);
  }
}
