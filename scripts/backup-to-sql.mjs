#!/usr/bin/env node
/**
 * Turns one of the daily database backups (backups/daily/YYYY-MM-DD.json.gz,
 * from the admin's Storage page) into SQL that puts its rows back.
 *
 *   node scripts/backup-to-sql.mjs gold-2026-11-19.json.gz > restore.sql
 *
 * Run restore.sql in the Supabase SQL editor (or psql) on a database that
 * already has GOLD's tables: on a new project, run supabase/schema.sql first.
 * Triggers are switched off while it loads, so matching and the in-house
 * listing copies don't run again, and rows that are already there are skipped.
 */
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/backup-to-sql.mjs <backup.json.gz> > restore.sql');
  process.exit(1);
}

const raw = readFileSync(file);
const backup = JSON.parse((file.endsWith('.gz') ? gunzipSync(raw) : raw).toString('utf8'));
if (backup.version !== 1 || typeof backup.tables !== 'object') {
  console.error('This is not a GOLD backup.');
  process.exit(1);
}

const quote = (text) => `'${String(text).replace(/'/g, "''")}'`;
const ident = (name) => `"${String(name).replace(/"/g, '""')}"`;

/** A Postgres array literal ({"a","b"}) for array columns, which come back from the API as JSON arrays. */
function arrayLiteral(values) {
  const items = values.map((item) =>
    item === null ? 'NULL' : `"${String(typeof item === 'object' ? JSON.stringify(item) : item).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  );
  return `{${items.join(',')}}`;
}

function literal(value, format = '') {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null';
  if (Array.isArray(value) && format.endsWith('[]')) return quote(arrayLiteral(value));
  if (typeof value === 'object') return quote(JSON.stringify(value));
  return quote(value);
}

const out = [
  `-- GOLD backup from ${backup.createdAt}`,
  'begin;',
  "set local session_replication_role = 'replica';"
];
for (const [table, rows] of Object.entries(backup.tables)) {
  if (!Array.isArray(rows) || rows.length === 0) continue;
  const formats = backup.columns?.[table] ?? {};
  const columns = Object.keys(rows[0]);
  out.push(`-- ${table}: ${rows.length} rows`);
  for (let at = 0; at < rows.length; at += 200) {
    const values = rows
      .slice(at, at + 200)
      .map((row) => `(${columns.map((column) => literal(row[column], formats[column])).join(', ')})`)
      .join(',\n  ');
    out.push(`insert into public.${ident(table)} (${columns.map(ident).join(', ')}) values\n  ${values}\non conflict do nothing;`);
  }
}
out.push('commit;');
process.stdout.write(`${out.join('\n')}\n`);
