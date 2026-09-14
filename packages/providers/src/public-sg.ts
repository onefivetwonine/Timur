import { errored, providerFetch, skipped } from './http.js';
import type { ProviderAdapter, ProviderCredentials, ProviderPullResult } from './types.js';

/** OpenCorporates — public company registry; optional OPENCORPORATES_API_TOKEN raises limits. */
export const opencorporatesAdapter: ProviderAdapter = {
  id: 'opencorporates',
  label: 'OpenCorporates',
  requiredEnv: [],
  async pull({ env }: ProviderCredentials, options = {}): Promise<ProviderPullResult> {
    const limit = Math.min(options.limit ?? 10, 20);
    try {
      const url = new URL('https://api.opencorporates.com/v0.4/companies/search');
      url.searchParams.set('q', 'bank');
      url.searchParams.set('jurisdiction_code', 'sg');
      url.searchParams.set('per_page', String(limit));
      if (env.OPENCORPORATES_API_TOKEN?.trim()) {
        url.searchParams.set('api_token', env.OPENCORPORATES_API_TOKEN.trim());
      }
      const response = await providerFetch('opencorporates', url);
      const json = await response.json() as {
        results?: { companies?: Array<{ company?: Record<string, unknown> }> };
      };
      const companies = (json.results?.companies ?? []).map((entry, index) => {
        const row = entry.company ?? {};
        return {
          provider: this.id,
          externalId: String(row.company_number ?? row.id ?? `oc-${index}`),
          name: String(row.name ?? 'unknown'),
          country: 'Singapore',
          uen: row.company_number ? String(row.company_number) : undefined,
          industry: undefined,
          raw: row,
        };
      });
      return { provider: this.id, status: 'ok', companies, people: [], jobs: [] };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      if (message.includes('HTTP 401')) {
        return skipped(this.id, 'OpenCorporates requires OPENCORPORATES_API_TOKEN');
      }
      return errored(this.id, message);
    }
  },
};

/**
 * ACRA / Bizfile — official Singapore entity APIs.
 * Requires ACRA_BIZFILE_API_KEY (or client credentials) from the API Marketplace.
 */
export const acraBizfileAdapter: ProviderAdapter = {
  id: 'acra_bizfile',
  label: 'ACRA Bizfile',
  requiredEnv: ['ACRA_BIZFILE_API_KEY'],
  async pull({ env }: ProviderCredentials): Promise<ProviderPullResult> {
    if (!env.ACRA_BIZFILE_API_KEY?.trim()) {
      return skipped(this.id, 'missing ACRA_BIZFILE_API_KEY (subscribe via Bizfile API Marketplace)');
    }
    try {
      const url = new URL('https://api.bizfile.gov.sg/api/acra/entityQuery/entitySearch');
      url.searchParams.set('name', 'DBS');
      const response = await providerFetch('acra_bizfile', url, {
        headers: {
          'x-api-key': env.ACRA_BIZFILE_API_KEY,
          Authorization: `Bearer ${env.ACRA_BIZFILE_API_KEY}`,
        },
      });
      const json = await response.json() as unknown;
      const rows = Array.isArray(json) ? json : (json as { data?: unknown[] }).data ?? [json];
      const companies = (rows as Array<Record<string, unknown>>).slice(0, 10).map((row, index) => ({
        provider: this.id,
        externalId: String(row.uen ?? row.UEN ?? `acra-${index}`),
        name: String(row.name ?? row.entityName ?? 'unknown'),
        uen: row.uen || row.UEN ? String(row.uen ?? row.UEN) : undefined,
        country: 'Singapore',
        raw: row,
      }));
      return { provider: this.id, status: 'ok', companies, people: [], jobs: [] };
    } catch (error) {
      return errored(this.id, error instanceof Error ? error.message : 'unknown error');
    }
  },
};

/**
 * MyCareersFuture — Singapore jobs market (role calibration, not candidate PII).
 * Uses the public search endpoint used by the portal; schema may change.
 */
export const mycareersfutureAdapter: ProviderAdapter = {
  id: 'mycareersfuture',
  label: 'MyCareersFuture',
  requiredEnv: [],
  async pull(_credentials: ProviderCredentials, options = {}): Promise<ProviderPullResult> {
    const limit = Math.min(options.limit ?? 10, 20);
    try {
      const url = new URL('https://api.mycareersfuture.gov.sg/v2/jobs');
      url.searchParams.set('search', 'software engineer');
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('page', '0');
      const response = await providerFetch('mycareersfuture', url, {
        headers: { 'user-agent': 'timur-poc-foundation/0.1 (research; contact via repo)' },
      });
      const json = await response.json() as {
        results?: Array<Record<string, unknown>>;
        data?: Array<Record<string, unknown>>;
      };
      const rows = json.results ?? json.data ?? [];
      const jobs = rows.slice(0, limit).map((row, index) => {
        const company = (row.postedCompany ?? row.hiringCompany ?? row.company ?? {}) as Record<string, unknown>;
        return {
          provider: this.id,
          externalId: String(row.uuid ?? row.jobPostId ?? `mcf-${index}`),
          title: String(row.title ?? 'unknown'),
          companyName: company.name ? String(company.name) : undefined,
          uen: company.uen ? String(company.uen) : undefined,
          location: row.address && typeof row.address === 'object'
            ? String((row.address as { postalCode?: string }).postalCode ?? '')
            : undefined,
          raw: row,
        };
      });
      const companies = [...new Map(jobs.filter(j => j.companyName).map(j => [
        j.uen ?? j.companyName!,
        {
          provider: this.id,
          externalId: String(j.uen ?? j.companyName),
          name: j.companyName!,
          uen: j.uen,
          country: 'Singapore',
          raw: { fromJob: j.externalId },
        },
      ])).values()];
      return { provider: this.id, status: 'ok', companies, people: [], jobs };
    } catch (error) {
      return errored(this.id, error instanceof Error ? error.message : 'unknown error');
    }
  },
};
