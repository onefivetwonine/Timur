import { createServer } from 'node:http';

export function createHealthServer(checkDatabase: () => Promise<void>) {
  return createServer(async (request, response) => {
    response.setHeader('content-type', 'application/json');
    response.setHeader('cache-control', 'no-store');
    response.setHeader('x-content-type-options', 'nosniff');
    if (request.method !== 'GET') {
      response.writeHead(405, { allow: 'GET' }).end(JSON.stringify({ error: 'method_not_allowed' }));
      return;
    }
    if (request.url === '/health/live') {
      response.writeHead(200).end(JSON.stringify({ status: 'alive', service: 'timur-api' }));
      return;
    }
    if (request.url === '/health/ready') {
      try {
        await checkDatabase();
        response.writeHead(200).end(JSON.stringify({ status: 'ready', scope: 'foundation-database-connectivity' }));
      } catch {
        response.writeHead(503).end(JSON.stringify({ status: 'not_ready', dependency: 'database' }));
      }
      return;
    }
    response.writeHead(404).end(JSON.stringify({ error: 'not_found' }));
  });
}
