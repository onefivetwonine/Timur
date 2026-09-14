import assert from 'node:assert/strict';
import test from 'node:test';
import { providerIds, providerManifest, providers, pullAllProviders } from '../src/index.js';

test('registers every planned API peer', () => {
  assert.equal(providers.length, providerIds.length);
  assert.deepEqual(providers.map(p => p.id).sort(), [...providerIds].sort());
});

test('manifest exposes required env without secrets', () => {
  const crust = providerManifest().find(p => p.id === 'crustdata');
  assert.ok(crust);
  assert.deepEqual(crust.requiredEnv, ['CRUSTDATA_API_KEY']);
});

test('pullAllProviders skips locked peers without credentials', async () => {
  const results = await pullAllProviders({ env: {} }, { only: ['apollo', 'opencorporates'], limit: 1 });
  const apollo = results.find(r => r.provider === 'apollo');
  const oc = results.find(r => r.provider === 'opencorporates');
  assert.equal(apollo?.status, 'skipped');
  assert.ok(oc);
  assert.ok(oc.status === 'ok' || oc.status === 'error' || oc.status === 'skipped');
});
