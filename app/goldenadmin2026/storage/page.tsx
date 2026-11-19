import { readMoveStatus, type MoveStatus } from '@/lib/storage-move';
import { latestBackup, type BackupInfo } from '@/lib/backup';
import { StoragePanel } from '@/components/admin/storage-panel';
import { AdminNav } from '@/components/admin/admin-nav';
import { LogoutButton } from '@/components/admin/logout-button';

export const dynamic = 'force-dynamic';

export default async function AdminStoragePage() {
  let status: MoveStatus | null = null;
  let backup: BackupInfo | null = null;
  let loadError: string | null = null;
  try {
    [status, backup] = await Promise.all([readMoveStatus(), latestBackup()]);
  } catch (error) {
    console.error('Could not read the storage status', error);
    loadError = 'Could not check the files. Reload the page to try again.';
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <AdminNav current="storage" />
          <h1 className="mt-2 text-2xl font-medium uppercase tracking-[0.1em] text-white">Storage</h1>
        </div>
        <LogoutButton />
      </div>
      <div className="mt-8">
        <StoragePanel initialStatus={status} initialBackup={backup} loadError={loadError} />
      </div>
    </div>
  );
}
