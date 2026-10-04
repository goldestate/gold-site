import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminNav } from '@/components/admin/admin-nav';
import { LogoutButton } from '@/components/admin/logout-button';
import { NdaBadge } from '@/components/admin/nda-badge';
import { getNdaById, ndaFileUrl, readNdaSubject } from '@/lib/nda-store';
import {
  NDA_GOLD_PARTY,
  NDA_SECTIONS,
  NDA_TITLE,
  NDA_VERSION
} from '@/lib/nda';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cairo(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Africa/Cairo',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * One confidentiality agreement: who it is for, whether and how it was signed,
 * and the signature or signed copy itself. The file lives in a private bucket
 * and is shown through a link that expires after an hour.
 */
export default async function AdminNdaPage({ params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) notFound();
  const nda = await getNdaById(params.id);
  if (!nda) notFound();

  const subject = await readNdaSubject(nda);
  const ext = nda.filePath?.split('.').pop()?.toLowerCase() ?? '';
  const isImage = ext === 'png' || ext === 'jpg' || ext === 'webp';
  const downloadName = `GOLD-NDA-${nda.signer.name.replace(/[^\p{L}\p{N}]+/gu, '-')}.${ext || 'file'}`;
  const [viewUrl, downloadUrl] = nda.filePath
    ? await Promise.all([ndaFileUrl(nda.filePath), ndaFileUrl(nda.filePath, downloadName)])
    : [null, null];

  const rows: [string, string][] = [
    ['Name', nda.signer.name],
    ['Company', nda.signer.company || '—'],
    ['Contact number', nda.signer.phone || '—'],
    ['Email', nda.signer.email || '—'],
    [
      'Submission',
      subject?.kind === 'request'
        ? `Unit request ${subject.referenceCode}`
        : subject?.kind === 'listing'
          ? 'Property listing'
          : '—'
    ],
    ['Signed', nda.status === 'signed' ? cairo(nda.signedAt) : 'Not yet'],
    ['How', nda.method === 'drawn' ? 'Signed on screen' : nda.method === 'uploaded' ? 'Uploaded a signed copy' : '—'],
    ['Agreement version', nda.agreementVersion]
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AdminNav current="rental-desk" />
        <LogoutButton />
      </div>
      <Link
        href="/goldenadmin2026/rental-desk"
        className="mt-6 inline-flex min-h-[40px] items-center text-xs uppercase tracking-[0.18em] text-white/40 transition hover:text-[#D9B355]"
      >
        &larr; Rental Desk
      </Link>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-medium uppercase tracking-[0.1em] text-white">Confidentiality agreement</h1>
        <NdaBadge nda={{ id: nda.id, status: nda.status, token: nda.token }} />
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-[0.16em] text-white/45">{label}</dt>
              <dd className="mt-1 break-words text-sm text-white" dir="auto">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {nda.status === 'signed' ? (
        <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">
              {nda.method === 'drawn' ? 'Signature' : 'Signed copy'}
            </div>
            {downloadUrl ? (
              <a
                href={downloadUrl}
                className="inline-flex min-h-[40px] items-center rounded-full border border-[rgba(217,179,85,0.45)] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#D9B355] transition hover:border-[#D9B355]"
              >
                Download
              </a>
            ) : null}
          </div>
          <div className="mt-4">
            {viewUrl && isImage ? (
              // White behind it: a drawn signature is dark ink on white.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={viewUrl} alt={`Signature of ${nda.signer.name}`} className="max-h-[32rem] w-full rounded-[1rem] bg-white object-contain p-2" />
            ) : viewUrl ? (
              <a href={viewUrl} target="_blank" rel="noreferrer" className="text-sm text-[#D9B355] underline-offset-2 hover:underline">
                Open the signed PDF
              </a>
            ) : (
              <p className="text-sm text-red-300">The file could not be opened. Reload the page to try again.</p>
            )}
          </div>
          <p className="mt-3 text-[11px] text-white/35">Links to the file stop working after an hour; reload the page for a new one.</p>
        </div>
      ) : (
        <div className="mt-6 rounded-[1.5rem] border border-[rgba(217,179,85,0.35)] bg-[rgba(217,179,85,0.06)] p-6 text-sm text-white/75">
          Not signed yet. &ldquo;Copy signing link&rdquo; above copies the link to send on WhatsApp.
        </div>
      )}

      <details className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
        <summary className="cursor-pointer text-xs uppercase tracking-[0.18em] text-white/55">
          The agreement text (version {NDA_VERSION})
        </summary>
        {nda.agreementVersion !== NDA_VERSION ? (
          <p className="mt-3 text-sm text-[#D9A441]">
            This was signed under version {nda.agreementVersion}; the text below is the current version.
          </p>
        ) : null}
        <div className="mt-4 space-y-4 text-sm leading-7 text-white/75">
          <p className="font-medium uppercase tracking-[0.1em] text-white">{NDA_TITLE}</p>
          {NDA_SECTIONS.map((section) => (
            <div key={section.heading}>
              <p className="font-medium text-white">{section.heading}</p>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets ? (
                <ul className="list-disc pl-5">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              {section.after?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          ))}
          <p className="text-white">{NDA_GOLD_PARTY}.</p>
        </div>
      </details>
    </div>
  );
}
