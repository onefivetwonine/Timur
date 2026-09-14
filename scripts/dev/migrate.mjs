import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import pg from 'pg';

let client;
try {
  if (process.env.TIMUR_ENVIRONMENT !== 'poc') throw new Error('Local migration runner requires POC');
  const url = new URL(process.env.MIGRATION_DATABASE_URL ?? 'missing:');
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.search || url.hash ||
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.pathname !== '/timur_poc') {
    throw new Error('Local migrations require loopback timur_poc database without URL options');
  }
  client = new pg.Client({
    host: url.hostname === '[::1]' ? '::1' : url.hostname,
    port: Number(url.port || 5432), database: 'timur_poc',
    user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
    ssl: false, connectionTimeoutMillis: 5000,
  });
  await client.connect();
  await client.query('SELECT pg_advisory_lock(842197351)');
  await client.query('CREATE TABLE IF NOT EXISTS public.timur_schema_migrations (name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
  const directory = new URL('../../database/migrations/', import.meta.url);
  const files = (await readdir(directory)).filter(f => /^\d{4}_[a-z0-9_]+\.sql$/.test(f)).sort();
  const applied = await client.query('SELECT name, sha256 FROM public.timur_schema_migrations ORDER BY name');
  for (const row of applied.rows) if (!files.includes(row.name)) throw new Error('Applied migration is missing from repository');
  for (const name of files) {
    const sql = await readFile(new URL(name, directory), 'utf8');
    const hash = createHash('sha256').update(sql).digest('hex');
    const previous = applied.rows.find(row => row.name === name);
    if (previous) {
      if (previous.sha256 !== hash) throw new Error(`Applied migration changed: ${name}`);
      continue;
    }
    if (applied.rows.some(row => row.name > name)) throw new Error(`Out-of-order migration: ${name}`);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO public.timur_schema_migrations (name, sha256) VALUES ($1, $2)', [name, hash]);
      await client.query('COMMIT');
      console.log(`Applied ${name}`);
    } catch (error) { await client.query('ROLLBACK'); throw error; }
  }
} catch {
  console.error('Migration failed. Check connectivity, role provisioning and immutable migration history. Credentials and server diagnostics are not logged.');
  process.exitCode = 1;
} finally { if (client) await client.end(); }
