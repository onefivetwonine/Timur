import { loadConfig } from '@timur/runtime';

const config = loadConfig();
console.info(JSON.stringify({ event: 'started', service: 'worker', environment: config.environment, mode: 'idle-foundation' }));
// Scheduling heartbeat only. No ingestion, inference, queue claiming, or candidate processing exists yet.
const timer = setInterval(() => {
  console.info(JSON.stringify({ event: 'heartbeat', service: 'worker', mode: 'idle-foundation' }));
}, 30000);
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    clearInterval(timer);
    console.info(JSON.stringify({ event: 'stopped', service: 'worker' }));
  });
}
