import {
  apolloAdapter,
  cognismAdapter,
  hunterAdapter,
  lushaAdapter,
  proxycurlAdapter,
  theorgAdapter,
  zoominfoAdapter,
} from './commercial.js';
import { crustdataAdapter } from './crustdata.js';
import { datagovsgAdapter, githubAdapter, huggingfaceAdapter } from './open-web.js';
import { peopledatalabsAdapter } from './peopledatalabs.js';
import { acraBizfileAdapter, mycareersfutureAdapter, opencorporatesAdapter } from './public-sg.js';
import { dinqAdapter, linkedinAdapter } from './talent-search.js';
import type { ProviderAdapter, ProviderCredentials, ProviderId, ProviderPullResult } from './types.js';
import { providerIds } from './types.js';

export const providers: readonly ProviderAdapter[] = [
  crustdataAdapter,
  dinqAdapter,
  peopledatalabsAdapter,
  apolloAdapter,
  zoominfoAdapter,
  cognismAdapter,
  lushaAdapter,
  theorgAdapter,
  hunterAdapter,
  proxycurlAdapter,
  linkedinAdapter,
  githubAdapter,
  huggingfaceAdapter,
  opencorporatesAdapter,
  acraBizfileAdapter,
  mycareersfutureAdapter,
  datagovsgAdapter,
];

export function getProvider(id: ProviderId): ProviderAdapter {
  const found = providers.find(provider => provider.id === id);
  if (!found) throw new Error(`Unknown provider: ${id}`);
  return found;
}

export async function pullAllProviders(
  credentials: ProviderCredentials,
  options?: { limit?: number; only?: readonly ProviderId[] },
): Promise<ProviderPullResult[]> {
  const selected = options?.only?.length
    ? providers.filter(provider => options.only!.includes(provider.id))
    : [...providers];
  const results: ProviderPullResult[] = [];
  for (const provider of selected) {
    results.push(await provider.pull(credentials, { limit: options?.limit }));
  }
  return results;
}

export function providerManifest(): Array<{ id: ProviderId; label: string; requiredEnv: readonly string[] }> {
  return providers.map(({ id, label, requiredEnv }) => ({ id, label, requiredEnv }));
}

export { providerIds };
