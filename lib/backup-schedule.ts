import { r2Config } from './r2';
import { latestBackup, runBackup } from './backup';

const HOUR = 60 * 60 * 1000;
/** A day's backup is due once the newest is this old; under 24 hours so it doesn't drift later each day. */
const DUE_AFTER = 20 * HOUR;

/**
 * Started once per server (instrumentation.ts). Every hour, and a few minutes
 * after the server starts, backs up the database if the newest backup is
 * older than DUE_AFTER. Nothing happens until Cloudflare R2 is set up.
 */
export function startBackupSchedule(): void {
  const scope = globalThis as typeof globalThis & { goldBackupTimer?: ReturnType<typeof setInterval> };
  if (scope.goldBackupTimer) return;

  const tick = async () => {
    if (!r2Config()) return;
    try {
      const latest = await latestBackup();
      if (latest && Date.now() - Date.parse(latest.at) < DUE_AFTER) return;
      const result = await runBackup();
      console.log(`Backed up ${result.rows} rows to ${result.key} (${Math.round(result.size / 1024)} KB)`);
    } catch (error) {
      console.error('The daily backup failed; it will try again within the hour', error);
    }
  };

  setTimeout(tick, 3 * 60 * 1000).unref();
  scope.goldBackupTimer = setInterval(tick, HOUR);
  scope.goldBackupTimer.unref();
}
