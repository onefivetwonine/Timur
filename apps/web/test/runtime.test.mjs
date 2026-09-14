import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

async function availablePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function start(port, overrides) {
  const child = spawn(process.execPath, ['.next/standalone/apps/web/server.js'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      TIMUR_ENVIRONMENT: 'poc',
      TIMUR_DATA_MODE: 'synthetic',
      TIMUR_AI_PROVIDER: 'deterministic',
      TIMUR_EXTERNAL_AI_ENABLED: 'false',
      HOSTNAME: '127.0.0.1',
      PORT: String(port),
      ...overrides,
    },
    stdio: 'ignore',
  });
  const exited = once(child, 'exit');
  return { child, exited };
}

test('one standalone image reflects runtime environments and rejects unsafe startup', { timeout: 30000 }, async () => {
  for (const environment of ['poc', 'production']) {
    const port = await availablePort();
    const { child, exited } = start(port, { TIMUR_ENVIRONMENT: environment });
    try {
      let response;
      for (let attempt = 0; attempt < 100; attempt += 1) {
        assert.equal(child.exitCode, null, 'server exited before accepting requests');
        try {
          response = await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(1000) });
          break;
        } catch { await delay(50); }
      }
      assert.ok(response, 'server did not start in time');
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.ok(html.includes(environment === 'poc'
        ? 'POC · Synthetic data only · Not for production decisions'
        : 'Production environment · Foundation only'));
    } finally {
      child.kill('SIGTERM');
      const timer = setTimeout(() => child.kill('SIGKILL'), 3000);
      await exited;
      clearTimeout(timer);
    }
  }
  for (const overrides of [
    { TIMUR_ENVIRONMENT: 'invalid' },
    { TIMUR_ENVIRONMENT: 'poc', TIMUR_DATA_MODE: 'controlled' },
    { TIMUR_ENVIRONMENT: 'production', TIMUR_EXTERNAL_AI_ENABLED: 'true' },
  ]) {
    const { child, exited } = start(await availablePort(), overrides);
    const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
    const [code, signal] = await exited;
    clearTimeout(timer);
    assert.equal(signal, null, 'unsafe server did not exit promptly');
    assert.equal(code, 1, 'unsafe configuration must terminate the server');
  }
});
