import { gzipSync } from 'node:zlib';
import { supabase } from './supabase';
import { r2Config, r2Delete, r2Exists, r2List, r2Put, r2SignedUrl } from './r2';
import { addDays, cairoDayOf } from './cairo-time';

/**
 * Server-only. A copy of every table's rows, once a day, in the private R2
 * bucket, because Supabase's free plan keeps no backups of its own:
 *
 *   backups/daily/YYYY-MM-DD.json.gz   the last 31 days
 *   backups/monthly/YYYY-MM.json.gz    the first backup of each month, the last 13 months
 *
 * The tables' structure (columns, functions, triggers) is supabase/schema.sql;
 * a backup is the data. scripts/backup-to-sql.mjs turns one into SQL that
 * loads it back.
 */

const DAILY = 'backups/daily/';
const MONTHLY = 'backups/monthly/';
const KEEP_DAYS = 31;
const KEEP_MONTHS = 13;
/** Short-lived counters, rebuilt as requests come in; nothing to restore. */
const SKIP_TABLES = new Set(['rate_limit_buckets']);
/** Used if the database can't list its own tables. */
const KNOWN_TABLES = [
  'properties',
  'property_deletions',
  'brokers',
  'owners',
  'rental_requests',
  'rental_listings',
  'matches',
  'nda_agreements',
  'compounds',
  'places',
  'compound_codes',
  'redemptions'
];
const PAGE = 1000;

type TableInfo = { columns: Record<string, string>; primaryKey: string | null };

/** The tables the database exposes, with each column's type, from its API description. */
async function discoverTables(): Promise<Record<string, TableInfo>> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key ?? '', Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const spec = (await res.json()) as { definitions?: Record<string, { properties?: Record<string, { format?: string; description?: string }> }> };
    const tables: Record<string, TableInfo> = {};
    for (const [name, definition] of Object.entries(spec.definitions ?? {})) {
      const columns: Record<string, string> = {};
      let primaryKey: string | null = null;
      for (const [column, property] of Object.entries(definition.properties ?? {})) {
        columns[column] = property.format ?? 'text';
        if (!primaryKey && property.description?.includes('<pk/>')) primaryKey = column;
      }
      tables[name] = { columns, primaryKey };
    }
    if (Object.keys(tables).length > 0) return tables;
  } catch (error) {
    console.error('Could not list the tables for the backup; using the known list', error);
  }
  return Object.fromEntries(KNOWN_TABLES.map((name) => [name, { columns: {}, primaryKey: 'id' }]));
}

async function readTable(name: string, primaryKey: string | null): Promise<unknown[]> {
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE) {
    let query = supabase.from(name).select('*');
    if (primaryKey) query = query.order(primaryKey);
    const { data, error } = await query.range(from, from + PAGE - 1);
    if (error) {
      // A known table whose migration hasn't run.
      const code = (error as { code?: unknown }).code;
      if (code === 'PGRST205' || code === '42P01') return rows;
      throw error;
    }
    rows.push(...(data ?? []));
    if ((data ?? []).length < PAGE) return rows;
  }
}

export type BackupResult = { key: string; size: number; rows: number };

let running: Promise<BackupResult> | null = null;

/** Backs up every table now. Two calls at once share one run. */
export function runBackup(): Promise<BackupResult> {
  running ??= backUp().finally(() => {
    running = null;
  });
  return running;
}

async function backUp(): Promise<BackupResult> {
  const r2 = r2Config();
  if (!r2) throw new Error('Cloudflare R2 is not set up.');

  const tables = await discoverTables();
  const data: Record<string, unknown[]> = {};
  const columns: Record<string, Record<string, string>> = {};
  let rows = 0;
  for (const [name, info] of Object.entries(tables)) {
    if (SKIP_TABLES.has(name)) continue;
    data[name] = await readTable(name, info.primaryKey);
    columns[name] = info.columns;
    rows += data[name].length;
  }

  const createdAt = new Date().toISOString();
  const body = gzipSync(JSON.stringify({ version: 1, createdAt, columns, tables: data }));
  const day = cairoDayOf(createdAt);
  const key = `${DAILY}${day}.json.gz`;
  await r2Put(r2.privateBucket, key, body, 'application/gzip');

  const monthly = `${MONTHLY}${day.slice(0, 7)}.json.gz`;
  if (!(await r2Exists(r2.privateBucket, monthly))) await r2Put(r2.privateBucket, monthly, body, 'application/gzip');

  await prune(day);
  return { key, size: body.length, rows };
}

/** Deletes daily backups older than KEEP_DAYS and monthly ones older than KEEP_MONTHS. */
async function prune(today: string): Promise<void> {
  const r2 = r2Config();
  if (!r2) return;
  const oldestDay = addDays(today, -KEEP_DAYS);
  const [year, month] = today.split('-').map(Number);
  const oldestMonthIndex = year * 12 + (month - 1) - KEEP_MONTHS;
  const oldestMonth = `${Math.floor(oldestMonthIndex / 12)}-${String((oldestMonthIndex % 12) + 1).padStart(2, '0')}`;

  for (const object of await r2List(r2.privateBucket, DAILY)) {
    const day = object.key.slice(DAILY.length, DAILY.length + 10);
    if (day < oldestDay) await r2Delete(r2.privateBucket, object.key);
  }
  for (const object of await r2List(r2.privateBucket, MONTHLY)) {
    const month = object.key.slice(MONTHLY.length, MONTHLY.length + 7);
    if (month < oldestMonth) await r2Delete(r2.privateBucket, object.key);
  }
}

export type BackupInfo = { key: string; at: string; size: number };

/** The newest daily backup, or null when there is none (or R2 isn't set up). */
export async function latestBackup(): Promise<BackupInfo | null> {
  const r2 = r2Config();
  if (!r2) return null;
  const objects = await r2List(r2.privateBucket, DAILY);
  const newest = objects.sort((a, b) => a.key.localeCompare(b.key)).pop();
  return newest ? { key: newest.key, at: newest.lastModified, size: newest.size } : null;
}

/** A one-hour download link for a backup. */
export async function backupDownloadUrl(key: string): Promise<string> {
  const r2 = r2Config();
  if (!r2) throw new Error('Cloudflare R2 is not set up.');
  return r2SignedUrl(r2.privateBucket, key, 60 * 60, `gold-${key.split('/').pop()}`);
}
