'use client';

import { useState } from 'react';
import { adminFetch } from '@/lib/admin-fetch';
import { formatCairoDateTime } from '@/lib/cairo-time';
import type { MoveStatus } from '@/lib/storage-move';
import type { BackupInfo } from '@/lib/backup';

type Busy = 'copy' | 'links' | 'cleanup' | 'backup' | 'download' | null;

const card = 'rounded-[1.5rem] border border-white/10 bg-white/5 p-6';
const goldButton =
  'btn-gold min-h-[44px] rounded-full px-6 text-xs font-semibold uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50';
const plainButton =
  'min-h-[44px] rounded-full border border-white/15 px-5 text-xs uppercase tracking-[0.16em] text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40';

const count = (value: number) => value.toLocaleString('en-GB');

export function StoragePanel({
  initialStatus,
  initialBackup,
  loadError
}: {
  initialStatus: MoveStatus | null;
  initialBackup: BackupInfo | null;
  loadError: string | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [backup, setBackup] = useState(initialBackup);
  const [busy, setBusy] = useState<Busy>(null);
  const [progress, setProgress] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(loadError ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const refresh = async () => {
    const result = await adminFetch<{ status: MoveStatus; backup: BackupInfo | null }>('/api/admin/storage');
    if (result.ok) {
      setStatus(result.data.status);
      setBackup(result.data.backup);
    }
  };

  const post = <T,>(action: string) => adminFetch<T>('/api/admin/storage', { method: 'POST', body: { action } });

  const copyAll = async () => {
    setBusy('copy');
    setError('');
    setMessage('');
    let copied = 0;
    const failed = new Set<string>();
    for (;;) {
      const result = await post<{ copied: number; failed: string[]; left: number }>('copy');
      if (!result.ok) {
        setError(result.error);
        break;
      }
      copied += result.data.copied;
      result.data.failed.forEach((key) => failed.add(key));
      setProgress(`Copied ${count(copied)} · ${count(result.data.left)} to go`);
      // Done, or only files that keep failing are left.
      if (result.data.left === 0 || result.data.copied === 0) {
        setMessage(
          failed.size > 0
            ? `Copied ${count(copied)}. ${count(failed.size)} couldn’t be copied: press Copy again to retry them.`
            : `Copied ${count(copied)} files.`
        );
        break;
      }
    }
    setProgress('');
    await refresh();
    setBusy(null);
  };

  const switchLinks = async () => {
    setBusy('links');
    setError('');
    setMessage('');
    const result = await post<{ switched: number; notCopied: number }>('links');
    if (result.ok) {
      setMessage(
        `Switched ${count(result.data.switched)} photo links.` +
          (result.data.notCopied > 0 ? ` ${count(result.data.notCopied)} point at files that aren’t copied yet.` : '')
      );
    } else {
      setError(result.error);
    }
    await refresh();
    setBusy(null);
  };

  const deleteOld = async () => {
    setConfirmDelete(false);
    setBusy('cleanup');
    setError('');
    setMessage('');
    let deleted = 0;
    let kept = 0;
    for (;;) {
      const result = await post<{ deleted: number; kept: number; left: number }>('cleanup');
      if (!result.ok) {
        setError(result.error);
        break;
      }
      deleted += result.data.deleted;
      kept = result.data.kept;
      setProgress(`Deleted ${count(deleted)} · ${count(result.data.left)} to go`);
      if (result.data.left === 0 || result.data.deleted === 0) break;
    }
    setProgress('');
    setMessage(
      `Deleted ${count(deleted)} copies from Supabase.` +
        (kept > 0 ? ` ${count(kept)} stay there: they aren’t on Cloudflare yet, or a link still uses them.` : '')
    );
    await refresh();
    setBusy(null);
  };

  const backUpNow = async () => {
    setBusy('backup');
    setError('');
    setMessage('');
    const result = await post<{ backup: BackupInfo | null }>('backup');
    if (result.ok) {
      setBackup(result.data.backup);
      setMessage('Backed up.');
    } else {
      setError(result.error);
    }
    setBusy(null);
  };

  const download = async () => {
    setBusy('download');
    setError('');
    const result = await post<{ url: string }>('backup-link');
    if (result.ok) window.location.href = result.data.url;
    else setError(result.error);
    setBusy(null);
  };

  const ready = status?.ready ?? false;
  const allCopied = status !== null && status.copied === status.onSupabase;
  const finished = status !== null && ready && status.onSupabase === 0 && status.linksOnSupabase === 0;

  return (
    <div className="space-y-6">
      <section className={card}>
        <h2 className="text-lg font-medium uppercase tracking-[0.14em] text-white">Files</h2>
        {status === null ? null : finished ? (
          <p className="mt-3 text-sm text-[#7ED9A0]">All files are on Cloudflare.</p>
        ) : (
          <>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-[1rem] bg-black/20 px-4 py-3">
                <dt className="text-[11px] uppercase tracking-[0.16em] text-white/40">On Supabase</dt>
                <dd className="mt-1 text-xl text-white">{count(status.onSupabase)}</dd>
              </div>
              <div className="rounded-[1rem] bg-black/20 px-4 py-3">
                <dt className="text-[11px] uppercase tracking-[0.16em] text-white/40">Copied to Cloudflare</dt>
                <dd className="mt-1 text-xl text-white">{count(status.copied)}</dd>
              </div>
              <div className="rounded-[1rem] bg-black/20 px-4 py-3">
                <dt className="text-[11px] uppercase tracking-[0.16em] text-white/40">Links on Supabase</dt>
                <dd className="mt-1 text-xl text-white">{count(status.linksOnSupabase)}</dd>
              </div>
            </dl>

            {!ready ? (
              <p className="mt-4 text-sm text-white/60">Cloudflare isn’t connected yet. Files stay on Supabase.</p>
            ) : (
              <ol className="mt-6 space-y-4">
                <li className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-white/80">1. Copy the files to Cloudflare</span>
                  <button type="button" onClick={copyAll} disabled={busy !== null || allCopied} className={goldButton}>
                    {busy === 'copy' ? 'Copying...' : allCopied ? 'Copied' : 'Copy'}
                  </button>
                </li>
                <li className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-white/80">2. Switch the photo links to Cloudflare</span>
                  <button
                    type="button"
                    onClick={switchLinks}
                    disabled={busy !== null || status.linksOnSupabase === 0 || status.copied === 0}
                    className={goldButton}
                  >
                    {busy === 'links' ? 'Switching...' : status.linksOnSupabase === 0 ? 'Switched' : 'Switch'}
                  </button>
                </li>
                <li className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-white/80">3. Delete the old copies on Supabase</span>
                  {confirmDelete ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-white/60">Delete for good?</span>
                      <button
                        type="button"
                        onClick={deleteOld}
                        className="min-h-[44px] rounded-full border border-red-400/60 bg-red-500/10 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-red-200"
                      >
                        Yes, delete
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(false)} className={plainButton}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      disabled={busy !== null || status.copied === 0}
                      className="min-h-[44px] rounded-full border border-red-400/40 px-5 text-xs uppercase tracking-[0.16em] text-red-300 transition hover:border-red-400/70 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {busy === 'cleanup' ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </li>
              </ol>
            )}
          </>
        )}
        {status && status.brokenLinks > 0 ? (
          <p className="mt-4 text-sm text-white/50">
            {status.brokenLinks === 1
              ? '1 listing photo was already missing before the move. Its link stays as it is.'
              : `${count(status.brokenLinks)} listing photos were already missing before the move. Their links stay as they are.`}
          </p>
        ) : null}
        {progress ? <p className="mt-4 text-sm text-[#D9B355]">{progress}</p> : null}
      </section>

      <section className={card}>
        <h2 className="text-lg font-medium uppercase tracking-[0.14em] text-white">Backups</h2>
        <p className="mt-3 text-sm text-white/70">
          {!ready
            ? 'Backups start once Cloudflare is connected.'
            : backup
              ? `Latest: ${formatCairoDateTime(backup.at)} (Cairo) · ${Math.max(1, Math.round(backup.size / 1024))} KB`
              : 'No backup yet.'}
        </p>
        {ready ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={backUpNow} disabled={busy !== null} className={goldButton}>
              {busy === 'backup' ? 'Backing up...' : 'Back up now'}
            </button>
            <button type="button" onClick={download} disabled={busy !== null || !backup} className={plainButton}>
              {busy === 'download' ? 'Opening...' : 'Download latest'}
            </button>
          </div>
        ) : null}
      </section>

      {message ? <p className="text-sm text-[#7ED9A0]">{message}</p> : null}
      {error ? (
        <div className="rounded-[1rem] border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</div>
      ) : null}
    </div>
  );
}
