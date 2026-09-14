import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { contractNames, validateContract } from '../src/index.js';

for (const name of contractNames) {
  test(`${name}: accepts synthetic fixture and denies another tenant`, () => {
    const fixture = JSON.parse(readFileSync(new URL(`../../../data/synthetic/${name}.json`, import.meta.url), 'utf8'));
    assert.deepEqual(validateContract(name, fixture, 'synthetic-tenant-a'), { valid: true });
    assert.equal(validateContract(name, fixture, 'synthetic-tenant-b').valid, false);
    assert.equal(validateContract(name, fixture, '').valid, false);
    assert.equal(validateContract(name, { ...fixture, tenant_id: undefined }, 'synthetic-tenant-a').valid, false);
    assert.equal(validateContract(name, { ...fixture, match_percentage: 94 }, 'synthetic-tenant-a').valid, false);
  });
}
test('upstream draft files match recorded source hashes', () => {
  const manifest = JSON.parse(readFileSync(new URL('../provenance.json', import.meta.url), 'utf8'));
  for (const file of manifest.files) {
    const bytes = readFileSync(new URL(`../schemas/${file.file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
  }
});
test('decision envelope rejects invalid authority and timestamps', () => {
  const fixture = JSON.parse(readFileSync(new URL('../../../data/synthetic/decision-envelope.json', import.meta.url), 'utf8'));
  assert.equal(validateContract('decision-envelope', { ...fixture, created_at: 'yesterday' }, 'synthetic-tenant-a').valid, false);
  fixture.next_action.authority_result = 'probably';
  assert.equal(validateContract('decision-envelope', fixture, 'synthetic-tenant-a').valid, false);
});
