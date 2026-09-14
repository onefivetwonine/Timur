export class ProviderHttpError extends Error {
  constructor(
    readonly provider: string,
    readonly status: number,
    message: string,
  ) {
    super(`${provider} HTTP ${status}: ${message}`);
    this.name = 'ProviderHttpError';
  }
}

export async function providerFetch(
  provider: string,
  url: string | URL,
  init: RequestInit = {},
): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const safe = body.replace(/Bearer\s+[^\s"]+/gi, 'Bearer [redacted]').slice(0, 400);
    throw new ProviderHttpError(provider, response.status, safe || response.statusText);
  }
  return response;
}

export function requireEnv(env: NodeJS.ProcessEnv, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (!value) return key;
  }
  return undefined;
}

export function skipped(
  provider: import('./types.js').ProviderId,
  reason: string,
): import('./types.js').ProviderPullResult {
  return { provider, status: 'skipped', reason, companies: [], people: [], jobs: [] };
}

export function errored(
  provider: import('./types.js').ProviderId,
  reason: string,
): import('./types.js').ProviderPullResult {
  return { provider, status: 'error', reason, companies: [], people: [], jobs: [] };
}
