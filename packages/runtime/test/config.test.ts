import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig, loadPort } from '../src/index.js';

test('POC has synthetic data and no external AI by default', () => {
  assert.deepEqual(loadConfig({ TIMUR_ENVIRONMENT: 'poc' }), {
    environment: 'poc', dataMode: 'synthetic', aiProvider: 'deterministic', externalAiEnabled: false,
  });
});
test('environment identity is explicit and strict', () => {
  for (const value of [undefined, '', 'prod', 'dev', 'Production', 'poc ']) {
    assert.throws(() => loadConfig({ TIMUR_ENVIRONMENT: value }));
  }
});
test('POC rejects controlled data', () => {
  assert.throws(() => loadConfig({ TIMUR_ENVIRONMENT: 'poc', TIMUR_DATA_MODE: 'controlled' }));
});
test('all environments reject enabling external AI or unknown providers', () => {
  for (const environment of ['poc', 'production']) {
    for (const enabled of ['true', '1', 'False', '']) {
      assert.throws(() => loadConfig({ TIMUR_ENVIRONMENT: environment, TIMUR_EXTERNAL_AI_ENABLED: enabled }));
    }
    assert.throws(() => loadConfig({ TIMUR_ENVIRONMENT: environment, TIMUR_AI_PROVIDER: 'openai' }));
    assert.throws(() => loadConfig({ TIMUR_ENVIRONMENT: environment, TIMUR_DATA_MODE: 'real' }));
  }
});
test('production scaffold supports controlled classification but still disables external AI', () => {
  assert.equal(loadConfig({ TIMUR_ENVIRONMENT: 'production', TIMUR_DATA_MODE: 'controlled' }).externalAiEnabled, false);
});
test('ports reject malformed and out of range values', () => {
  assert.equal(loadPort(undefined, 8000), 8000);
  assert.equal(loadPort('3000', 8000), 3000);
  for (const value of ['', '-1', '0', '65536', '1.5', '8000oops']) assert.throws(() => loadPort(value, 8000));
});
