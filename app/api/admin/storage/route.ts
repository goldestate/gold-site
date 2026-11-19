import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { cleanupBatch, copyBatch, readMoveStatus, switchLinks } from '@/lib/storage-move';
import { backupDownloadUrl, latestBackup, runBackup } from '@/lib/backup';

export const dynamic = 'force-dynamic';

/** Where the files are, and the newest backup. */
export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const [status, backup] = await Promise.all([readMoveStatus(), latestBackup()]);
    return NextResponse.json({ status, backup });
  } catch (error) {
    console.error('Could not read the storage status', error);
    return NextResponse.json({ error: 'Could not check the files. Try again.' }, { status: 500 });
  }
}

/**
 * One step of the move, or a backup. Body: { action }:
 *   copy        copy the next batch of files to Cloudflare
 *   links       point photo links at the Cloudflare copies
 *   cleanup     delete the next batch of Supabase copies that are safe to delete
 *   backup      back up the database now
 *   backup-link a download link for the newest backup
 */
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  let action: unknown;
  try {
    action = ((await request.json()) as { action?: unknown })?.action;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    switch (action) {
      case 'copy':
        return NextResponse.json(await copyBatch());
      case 'links':
        return NextResponse.json(await switchLinks());
      case 'cleanup':
        return NextResponse.json(await cleanupBatch());
      case 'backup': {
        await runBackup();
        return NextResponse.json({ backup: await latestBackup() });
      }
      case 'backup-link': {
        const latest = await latestBackup();
        if (!latest) return NextResponse.json({ error: 'There is no backup yet.' }, { status: 404 });
        return NextResponse.json({ url: await backupDownloadUrl(latest.key) });
      }
      default:
        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }
  } catch (error) {
    console.error(`Storage action ${String(action)} failed`, error);
    return NextResponse.json({ error: 'That didn’t work. Try again in a minute.' }, { status: 500 });
  }
}
