/** Runs once when a server starts (Next's instrumentation hook). */
export async function register() {
  // Written as a block, not an early return, so the edge build drops the import.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { startBackupSchedule } = await import('./lib/backup-schedule');
      startBackupSchedule();
    } catch (error) {
      // Never stop the site from starting over a backup.
      console.error('Could not start the daily backup', error);
    }
  }
}
