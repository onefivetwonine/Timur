import { loadConfig, loadPort } from '@timur/runtime';
import pg from 'pg';
import { createHealthServer } from './health.js';

const config = loadConfig();
const pool = process.env.DATABASE_URL ? new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  connectionTimeoutMillis: 3000,
  query_timeout: 3000,
  idleTimeoutMillis: 10000,
}) : undefined;
pool?.on('error', () => console.error(JSON.stringify({ event: 'database_pool_error' })));
const server = createHealthServer(async () => {
  if (!pool) throw new Error('Database is not configured');
  await pool.query('SELECT 1');
});
const port = loadPort(process.env.PORT, 8000);
server.listen(port, '0.0.0.0', () => {
  console.info(JSON.stringify({ event: 'started', service: 'api', environment: config.environment, port }));
});
let stopping = false;
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    const timeout = setTimeout(() => process.exit(1), 10000).unref();
    server.close(() => {
      void (pool?.end() ?? Promise.resolve()).then(() => {
        clearTimeout(timeout);
        process.exit(0);
      }, () => process.exit(1));
    });
  });
}
