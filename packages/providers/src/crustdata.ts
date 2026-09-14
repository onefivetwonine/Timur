import { errored, providerFetch, requireEnv, skipped } from './http.js';
import type { CompanyHit, PersonHit, ProviderAdapter, ProviderCredentials, ProviderPullResult } from './types.js';

const API = 'https://api.crustdata.com';
const VERSION = '2025-11-01';

async function crustPost(path: string, apiKey: string, body: unknown): Promise<unknown> {
  const response = await providerFetch('crustdata', `${API}${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      'x-api-version': VERSION,
    },
    body: JSON.stringify(body),
  });
  return response.json();
}

function companyFromIdentify(match: Record<string, unknown>): CompanyHit | undefined {
  const data = (match.company_data ?? match) as Record<string, unknown>;
  const basic = (data.basic_info ?? data) as Record<string, unknown>;
  const id = String(data.crustdata_company_id ?? basic.crustdata_company_id ?? '');
  const name = String(basic.name ?? '');
  if (!id || !name) return undefined;
  return {
    provider: 'crustdata',
    externalId: id,
    name,
    domain: basic.primary_domain || basic.website
      ? String(basic.primary_domain ?? basic.website)
      : undefined,
    country: 'Singapore',
    industry: Array.isArray(basic.industries) ? String(basic.industries[0]) : undefined,
    raw: match,
  };
}

function mapPeople(payload: unknown, limit: number, companyName?: string): PersonHit[] {
  const rows = (payload as { profiles?: unknown[] })?.profiles ?? [];
  const out: PersonHit[] = [];
  for (const row of rows.slice(0, limit)) {
    const r = row as Record<string, unknown>;
    const basic = (r.basic_profile ?? r) as Record<string, unknown>;
    const location = basic.location;
    const locationText = typeof location === 'object' && location
      ? String((location as { full_location?: string; country?: string }).full_location
        ?? (location as { country?: string }).country
        ?? '')
      : undefined;
    const name = String(basic.name ?? '');
    const id = String(r.crustdata_person_id ?? name);
    if (!id) continue;
    out.push({
      provider: 'crustdata',
      externalId: id,
      fullName: name || undefined,
      title: basic.current_title ? String(basic.current_title) : undefined,
      companyName,
      location: locationText || undefined,
      raw: row,
    });
  }
  return out;
}

export const crustdataAdapter: ProviderAdapter = {
  id: 'crustdata',
  label: 'Crustdata',
  requiredEnv: ['CRUSTDATA_API_KEY'],
  async pull({ env }: ProviderCredentials, options = {}): Promise<ProviderPullResult> {
    const missing = requireEnv(env, this.requiredEnv);
    if (missing) return skipped(this.id, `missing ${missing}`);
    const apiKey = env.CRUSTDATA_API_KEY!;
    const limit = Math.min(options.limit ?? 10, 25);
    try {
      const names = ['DBS Bank', 'OCBC Bank', 'United Overseas Bank', 'Grab', 'Sea Limited'];
      const identified = await crustPost('/company/identify', apiKey, { names }) as Array<{
        matched_on?: string;
        matches?: Array<Record<string, unknown>>;
      }>;
      const companies: CompanyHit[] = [];
      for (const row of identified) {
        const best = row.matches?.[0];
        if (!best) continue;
        const company = companyFromIdentify(best);
        if (company) companies.push(company);
        if (companies.length >= limit) break;
      }

      let people: PersonHit[] = [];
      const anchor = companies[0];
      if (anchor) {
        try {
          const peoplePayload = await crustPost('/person/search', apiKey, {
            filters: {
              op: 'and',
              conditions: [
                {
                  field: 'experience.employment_details.current.company_id',
                  type: '=',
                  value: anchor.externalId,
                },
                {
                  field: 'experience.employment_details.current.title',
                  type: '(.)',
                  value: 'Engineer',
                },
              ],
            },
            limit: Math.min(limit, 5),
          });
          people = mapPeople(peoplePayload, Math.min(limit, 5), anchor.name);
        } catch {
          people = [];
        }
      }

      return { provider: this.id, status: 'ok', companies, people, jobs: [] };
    } catch (error) {
      return errored(this.id, error instanceof Error ? error.message : 'unknown error');
    }
  },
};
