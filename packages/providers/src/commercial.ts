import { errored, providerFetch, requireEnv, skipped } from './http.js';
import type { ProviderAdapter, ProviderCredentials, ProviderPullResult } from './types.js';

/** Apollo people/org mixed search. */
export const apolloAdapter: ProviderAdapter = {
  id: 'apollo',
  label: 'Apollo',
  requiredEnv: ['APOLLO_API_KEY'],
  async pull({ env }: ProviderCredentials, options = {}): Promise<ProviderPullResult> {
    const missing = requireEnv(env, this.requiredEnv);
    if (missing) return skipped(this.id, `missing ${missing}`);
    const limit = Math.min(options.limit ?? 5, 10);
    try {
      const response = await providerFetch('apollo', 'https://api.apollo.io/api/v1/mixed_companies/search', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': env.APOLLO_API_KEY!,
        },
        body: JSON.stringify({ q_organization_locations: ['Singapore'], per_page: limit, page: 1 }),
      });
      const json = await response.json() as { organizations?: Array<Record<string, unknown>> };
      const companies = (json.organizations ?? []).map((row, index) => ({
        provider: this.id,
        externalId: String(row.id ?? `apollo-org-${index}`),
        name: String(row.name ?? 'unknown'),
        domain: row.primary_domain ? String(row.primary_domain) : undefined,
        country: row.country ? String(row.country) : 'Singapore',
        industry: row.industry ? String(row.industry) : undefined,
        raw: row,
      }));
      return { provider: this.id, status: 'ok', companies, people: [], jobs: [] };
    } catch (error) {
      return errored(this.id, error instanceof Error ? error.message : 'unknown error');
    }
  },
};

/** ZoomInfo — enterprise; requires ZOOMINFO_USERNAME + ZOOMINFO_PASSWORD or ZOOMINFO_ACCESS_TOKEN. */
export const zoominfoAdapter: ProviderAdapter = {
  id: 'zoominfo',
  label: 'ZoomInfo',
  requiredEnv: ['ZOOMINFO_ACCESS_TOKEN'],
  async pull({ env }: ProviderCredentials, options = {}): Promise<ProviderPullResult> {
    if (!env.ZOOMINFO_ACCESS_TOKEN?.trim() && !(env.ZOOMINFO_USERNAME && env.ZOOMINFO_PASSWORD)) {
      return skipped(this.id, 'missing ZOOMINFO_ACCESS_TOKEN (or USERNAME/PASSWORD)');
    }
    const limit = Math.min(options.limit ?? 5, 10);
    try {
      let token = env.ZOOMINFO_ACCESS_TOKEN?.trim();
      if (!token) {
        const auth = await providerFetch('zoominfo', 'https://api.zoominfo.com/authenticate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ username: env.ZOOMINFO_USERNAME, password: env.ZOOMINFO_PASSWORD }),
        });
        const authJson = await auth.json() as { jwt?: string };
        token = authJson.jwt;
      }
      if (!token) return errored(this.id, 'authentication did not return a token');
      const response = await providerFetch('zoominfo', 'https://api.zoominfo.com/search/company', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ country: 'Singapore', rpp: limit, page: 1 }),
      });
      const json = await response.json() as { data?: Array<Record<string, unknown>> };
      const companies = (json.data ?? []).map((row, index) => ({
        provider: this.id,
        externalId: String(row.id ?? row.companyId ?? `zi-${index}`),
        name: String(row.name ?? row.companyName ?? 'unknown'),
        domain: row.website ? String(row.website) : undefined,
        country: 'Singapore',
        raw: row,
      }));
      return { provider: this.id, status: 'ok', companies, people: [], jobs: [] };
    } catch (error) {
      return errored(this.id, error instanceof Error ? error.message : 'unknown error');
    }
  },
};

/** Cognism enrich/search — requires COGNISM_API_KEY. */
export const cognismAdapter: ProviderAdapter = {
  id: 'cognism',
  label: 'Cognism',
  requiredEnv: ['COGNISM_API_KEY'],
  async pull({ env }: ProviderCredentials, options = {}): Promise<ProviderPullResult> {
    const missing = requireEnv(env, this.requiredEnv);
    if (missing) return skipped(this.id, `missing ${missing}`);
    const limit = Math.min(options.limit ?? 5, 10);
    try {
      const response = await providerFetch('cognism', 'https://api.cognism.com/api/search/account', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${env.COGNISM_API_KEY}`,
        },
        body: JSON.stringify({ countries: ['Singapore'], pageSize: limit }),
      });
      const json = await response.json() as { results?: Array<Record<string, unknown>>; data?: Array<Record<string, unknown>> };
      const rows = json.results ?? json.data ?? [];
      const companies = rows.map((row, index) => ({
        provider: this.id,
        externalId: String(row.id ?? `cognism-${index}`),
        name: String(row.name ?? row.companyName ?? 'unknown'),
        domain: row.domain || row.website ? String(row.domain ?? row.website) : undefined,
        country: 'Singapore',
        raw: row,
      }));
      return { provider: this.id, status: 'ok', companies, people: [], jobs: [] };
    } catch (error) {
      return errored(this.id, error instanceof Error ? error.message : 'unknown error');
    }
  },
};

/** Lusha company enrich — requires LUSHA_API_KEY. */
export const lushaAdapter: ProviderAdapter = {
  id: 'lusha',
  label: 'Lusha',
  requiredEnv: ['LUSHA_API_KEY'],
  async pull({ env }: ProviderCredentials, options = {}): Promise<ProviderPullResult> {
    const missing = requireEnv(env, this.requiredEnv);
    if (missing) return skipped(this.id, `missing ${missing}`);
    void options;
    try {
      const response = await providerFetch(
        'lusha',
        'https://api.lusha.com/v2/company?company=DBS&location=Singapore',
        { headers: { api_key: env.LUSHA_API_KEY! } },
      );
      const json = await response.json() as Record<string, unknown>;
      const data = (json.data ?? json) as Record<string, unknown>;
      const companies = [{
        provider: this.id,
        externalId: String(data.companyId ?? data.id ?? 'lusha-dbs'),
        name: String(data.name ?? data.companyName ?? 'DBS'),
        domain: data.domain ? String(data.domain) : undefined,
        country: 'Singapore',
        raw: json,
      }];
      return { provider: this.id, status: 'ok', companies, people: [], jobs: [] };
    } catch (error) {
      return errored(this.id, error instanceof Error ? error.message : 'unknown error');
    }
  },
};

/** The Org — org chart search; THEORG_API_KEY when available. */
export const theorgAdapter: ProviderAdapter = {
  id: 'theorg',
  label: 'The Org',
  requiredEnv: ['THEORG_API_KEY'],
  async pull({ env }: ProviderCredentials): Promise<ProviderPullResult> {
    const missing = requireEnv(env, this.requiredEnv);
    if (missing) return skipped(this.id, `missing ${missing}`);
    try {
      const response = await providerFetch('theorg', 'https://api.theorg.com/v1/companies?q=Singapore&limit=5', {
        headers: { Authorization: `Bearer ${env.THEORG_API_KEY}` },
      });
      const json = await response.json() as { data?: Array<Record<string, unknown>>; companies?: Array<Record<string, unknown>> };
      const rows = json.data ?? json.companies ?? [];
      const companies = rows.map((row, index) => ({
        provider: this.id,
        externalId: String(row.id ?? row.slug ?? `theorg-${index}`),
        name: String(row.name ?? 'unknown'),
        domain: row.domain ? String(row.domain) : undefined,
        raw: row,
      }));
      return { provider: this.id, status: 'ok', companies, people: [], jobs: [] };
    } catch (error) {
      return errored(this.id, error instanceof Error ? error.message : 'unknown error');
    }
  },
};

/** Hunter domain search — email finder, not full people graph. */
export const hunterAdapter: ProviderAdapter = {
  id: 'hunter',
  label: 'Hunter',
  requiredEnv: ['HUNTER_API_KEY'],
  async pull({ env }: ProviderCredentials): Promise<ProviderPullResult> {
    const missing = requireEnv(env, this.requiredEnv);
    if (missing) return skipped(this.id, `missing ${missing}`);
    try {
      const url = new URL('https://api.hunter.io/v2/domain-search');
      url.searchParams.set('domain', 'dbs.com');
      url.searchParams.set('api_key', env.HUNTER_API_KEY!);
      url.searchParams.set('limit', '5');
      const response = await providerFetch('hunter', url);
      const json = await response.json() as { data?: { domain?: string; emails?: Array<Record<string, unknown>> } };
      const emails = json.data?.emails ?? [];
      const people = emails.map((row, index) => ({
        provider: this.id,
        externalId: String(row.value ?? `hunter-${index}`),
        fullName: [row.first_name, row.last_name].filter(Boolean).join(' ') || undefined,
        title: row.position ? String(row.position) : undefined,
        companyName: 'DBS',
        raw: row,
      }));
      return {
        provider: this.id,
        status: 'ok',
        companies: [{
          provider: this.id,
          externalId: String(json.data?.domain ?? 'dbs.com'),
          name: 'DBS',
          domain: 'dbs.com',
          country: 'Singapore',
          raw: json.data ?? json,
        }],
        people,
        jobs: [],
      };
    } catch (error) {
      return errored(this.id, error instanceof Error ? error.message : 'unknown error');
    }
  },
};

/** Proxycurl company profile by LinkedIn URL — PROXYCURL_API_KEY. */
export const proxycurlAdapter: ProviderAdapter = {
  id: 'proxycurl',
  label: 'Proxycurl',
  requiredEnv: ['PROXYCURL_API_KEY'],
  async pull({ env }: ProviderCredentials): Promise<ProviderPullResult> {
    const missing = requireEnv(env, this.requiredEnv);
    if (missing) return skipped(this.id, `missing ${missing}`);
    try {
      const url = new URL('https://nubela.co/proxycurl/api/linkedin/company');
      url.searchParams.set('url', 'https://www.linkedin.com/company/dbs-bank');
      const response = await providerFetch('proxycurl', url, {
        headers: { Authorization: `Bearer ${env.PROXYCURL_API_KEY}` },
      });
      const row = await response.json() as Record<string, unknown>;
      return {
        provider: this.id,
        status: 'ok',
        companies: [{
          provider: this.id,
          externalId: String(row.linkedin_internal_id ?? row.universal_name_id ?? 'proxycurl-dbs'),
          name: String(row.name ?? 'DBS Bank'),
          domain: row.website ? String(row.website) : undefined,
          country: typeof row.hq === 'object' && row.hq && 'country' in row.hq
            ? String((row.hq as { country?: unknown }).country ?? 'Singapore')
            : 'Singapore',
          industry: row.industry ? String(row.industry) : undefined,
          raw: row,
        }],
        people: [],
        jobs: [],
      };
    } catch (error) {
      return errored(this.id, error instanceof Error ? error.message : 'unknown error');
    }
  },
};
