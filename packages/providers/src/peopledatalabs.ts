import { errored, providerFetch, requireEnv, skipped } from './http.js';
import type { ProviderAdapter, ProviderCredentials, ProviderPullResult } from './types.js';

/** People Data Labs person + company search (requires PEOPLEDATALABS_API_KEY). */
export const peopledatalabsAdapter: ProviderAdapter = {
  id: 'peopledatalabs',
  label: 'People Data Labs',
  requiredEnv: ['PEOPLEDATALABS_API_KEY'],
  async pull({ env }: ProviderCredentials, options = {}): Promise<ProviderPullResult> {
    const missing = requireEnv(env, this.requiredEnv);
    if (missing) return skipped(this.id, `missing ${missing}`);
    const key = env.PEOPLEDATALABS_API_KEY!;
    const limit = Math.min(options.limit ?? 5, 10);
    try {
      const companyUrl = new URL('https://api.peopledatalabs.com/v5/company/search');
      companyUrl.searchParams.set('size', String(limit));
      companyUrl.searchParams.set('dataset', 'all');
      const companyRes = await providerFetch('peopledatalabs', companyUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': key },
        body: JSON.stringify({
          query: { bool: { must: [{ term: { 'location.country': 'singapore' } }] } },
          size: limit,
        }),
      });
      const companyJson = await companyRes.json() as { data?: Array<Record<string, unknown>> };
      const companies = (companyJson.data ?? []).map((row, index) => ({
        provider: this.id,
        externalId: String(row.id ?? row.website ?? `pdl-company-${index}`),
        name: String(row.name ?? 'unknown'),
        domain: row.website ? String(row.website) : undefined,
        country: row.location && typeof row.location === 'object'
          ? String((row.location as { country?: string }).country ?? '')
          : undefined,
        industry: Array.isArray(row.industry) ? String(row.industry[0]) : row.industry ? String(row.industry) : undefined,
        raw: row,
      }));

      const personUrl = new URL('https://api.peopledatalabs.com/v5/person/search');
      const personRes = await providerFetch('peopledatalabs', personUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': key },
        body: JSON.stringify({
          query: { bool: { must: [{ term: { 'location_country': 'singapore' } }] } },
          size: limit,
        }),
      });
      const personJson = await personRes.json() as { data?: Array<Record<string, unknown>> };
      const people = (personJson.data ?? []).map((row, index) => ({
        provider: this.id,
        externalId: String(row.id ?? `pdl-person-${index}`),
        fullName: row.full_name ? String(row.full_name) : undefined,
        title: row.job_title ? String(row.job_title) : undefined,
        companyName: row.job_company_name ? String(row.job_company_name) : undefined,
        profileUrl: Array.isArray(row.linkedin_url) ? String(row.linkedin_url[0]) : row.linkedin_url ? String(row.linkedin_url) : undefined,
        location: row.location_name ? String(row.location_name) : undefined,
        raw: row,
      }));

      return { provider: this.id, status: 'ok', companies, people, jobs: [] };
    } catch (error) {
      return errored(this.id, error instanceof Error ? error.message : 'unknown error');
    }
  },
};
