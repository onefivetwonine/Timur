import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { createHealthServer } from '../src/health.js';

test('health endpoints distinguish process life from database readiness without leaking errors', async (t) => {
  let available = false;
  const server = createHealthServer(async () => {
    if (!available) throw new Error('secret database connection string');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}`;
  assert.equal((await fetch(`${base}/health/live`)).status, 200);
  const failed = await fetch(`${base}/health/ready`);
  assert.equal(failed.status, 503);
  assert.deepEqual(await failed.json(), { status: 'not_ready', dependency: 'database' });
  available = true;
  assert.equal((await fetch(`${base}/health/ready`)).status, 200);
  assert.equal((await fetch(`${base}/candidates`)).status, 404);
  assert.equal((await fetch(`${base}/health/live`, { method: 'POST' })).status, 405);
});
