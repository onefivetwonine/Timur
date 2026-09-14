#!/usr/bin/env node
/**
 * Pull from every configured API peer into ignored local snapshots.
 * Usage: node --env-file=.local/providers.env scripts/providers/pull-available.mjs
 * Does not write personal data into Git. Requires network.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pullAllProviders, providerManifest } from '../../packages/providers/dist/index.js';

const outDir = new URL('../../.local/provider-snapshots/', import.meta.url);
await mkdir(outDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const results = await pullAllProviders({ env: process.env }, { limit: 10 });

const summary = results.map(result => ({
  provider: result.provider,
  status: result.status,
  reason: result.reason,
  companies: result.companies.length,
  people: result.people.length,
  jobs: result.jobs.length,
}));

for (const result of results) {
  if (result.status !== 'ok') continue;
  const payload = {
    pulled_at: new Date().toISOString(),
    provider: result.provider,
    companies: result.companies,
    people: result.people,
    jobs: result.jobs,
  };
  const body = `${JSON.stringify(payload, null, 2)}\n`;
  const hash = createHash('sha256').update(body).digest('hex');
  const file = new URL(`${stamp}-${result.provider}.json`, outDir);
  await writeFile(file, body, { mode: 0o600 });
  console.log(JSON.stringify({
    event: 'provider_snapshot_written',
    provider: result.provider,
    path: file.pathname,
    sha256: hash,
    companies: result.companies.length,
    people: result.people.length,
    jobs: result.jobs.length,
  }));
}

await writeFile(
  new URL(`${stamp}-summary.json`, outDir),
  `${JSON.stringify({ pulled_at: new Date().toISOString(), manifest: providerManifest(), summary }, null, 2)}\n`,
  { mode: 0o600 },
);

console.log(JSON.stringify({ event: 'provider_pull_complete', summary }, null, 2));
const failed = results.filter(r => r.status === 'error');
const ok = results.filter(r => r.status === 'ok');
if (!ok.length && failed.length) process.exitCode = 2;
else if (failed.length) process.exitCode = 0;
