import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

for (const [label, environment, url] of [
  ['production', 'production', 'postgresql://owner:sentinel-secret@127.0.0.1/timur_poc'],
  ['remote server', 'poc', 'postgresql://owner:sentinel-secret@example.invalid/timur_poc'],
  ['host query override', 'poc', 'postgresql://owner:sentinel-secret@localhost/timur_poc?host=example.invalid'],
  ['wrong database', 'poc', 'postgresql://owner:sentinel-secret@localhost/timur_production'],
  ['malformed URL', 'poc', 'sentinel-secret'],
]) {
  test(`migration refuses ${label} without exposing credentials`, () => {
    const result = spawnSync(process.execPath, ['scripts/dev/migrate.mjs'], {
      env: { ...process.env, TIMUR_ENVIRONMENT: environment, MIGRATION_DATABASE_URL: url },
      encoding: 'utf8', timeout: 1500,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Migration failed/);
    assert.doesNotMatch(result.stderr + result.stdout, /sentinel-secret/);
  });
}
