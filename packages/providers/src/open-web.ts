import { errored, providerFetch, skipped } from './http.js';
import type { CompanyHit, PersonHit, ProviderAdapter, ProviderCredentials, ProviderPullResult } from './types.js';

/** GitHub public user/org search — optional GITHUB_TOKEN raises rate limits. */
export const githubAdapter: ProviderAdapter = {
  id: 'github',
  label: 'GitHub',
  requiredEnv: [],
  async pull({ env }: ProviderCredentials, options = {}): Promise<ProviderPullResult> {
    const limit = Math.min(options.limit ?? 10, 20);
    try {
      const headers: Record<string, string> = {
        accept: 'application/vnd.github+json',
        'user-agent': 'timur-providers/0.1',
        'x-github-api-version': '2022-11-28',
      };
      if (env.GITHUB_TOKEN?.trim()) headers.authorization = `Bearer ${env.GITHUB_TOKEN.trim()}`;

      const userUrl = new URL('https://api.github.com/search/users');
      userUrl.searchParams.set('q', 'location:Singapore language:TypeScript');
      userUrl.searchParams.set('per_page', String(Math.min(limit, 10)));
      const userRes = await providerFetch('github', userUrl, { headers });
      const userJson = await userRes.json() as { items?: Array<Record<string, unknown>> };
      const people: PersonHit[] = (userJson.items ?? []).map((row, index) => ({
        provider: this.id,
        externalId: String(row.id ?? row.login ?? `gh-user-${index}`),
        fullName: row.login ? String(row.login) : undefined,
        profileUrl: row.html_url ? String(row.html_url) : undefined,
        location: 'Singapore',
        raw: row,
      }));

      const orgUrl = new URL('https://api.github.com/search/users');
      orgUrl.searchParams.set('q', 'DBS type:org');
      orgUrl.searchParams.set('per_page', '5');
      const orgRes = await providerFetch('github', orgUrl, { headers });
      const orgJson = await orgRes.json() as { items?: Array<Record<string, unknown>> };
      const companies: CompanyHit[] = (orgJson.items ?? []).map((row, index) => ({
        provider: this.id,
        externalId: String(row.id ?? row.login ?? `gh-org-${index}`),
        name: String(row.login ?? 'unknown'),
        domain: undefined,
        raw: row,
      }));

      return { provider: this.id, status: 'ok', companies, people, jobs: [] };
    } catch (error) {
      return errored(this.id, error instanceof Error ? error.message : 'unknown error');
    }
  },
};

/** Hugging Face Hub model authors — optional HF_TOKEN. */
export const huggingfaceAdapter: ProviderAdapter = {
  id: 'huggingface',
  label: 'Hugging Face',
  requiredEnv: [],
  async pull({ env }: ProviderCredentials, options = {}): Promise<ProviderPullResult> {
    const limit = Math.min(options.limit ?? 10, 20);
    try {
      const headers: Record<string, string> = { accept: 'application/json' };
      if (env.HF_TOKEN?.trim()) headers.authorization = `Bearer ${env.HF_TOKEN.trim()}`;
      const url = new URL('https://huggingface.co/api/models');
      url.searchParams.set('search', 'singapore');
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('sort', 'downloads');
      url.searchParams.set('direction', '-1');
      const response = await providerFetch('huggingface', url, { headers });
      const rows = await response.json() as Array<Record<string, unknown>>;
      const people: PersonHit[] = [];
      const seen = new Set<string>();
      for (const row of rows.slice(0, limit)) {
        const idValue = row.id;
        const author = String(
          row.author
          ?? (typeof idValue === 'string' ? idValue.split('/')[0] : '')
          ?? '',
        );
        if (!author || seen.has(author)) continue;
        seen.add(author);
        people.push({
          provider: this.id,
          externalId: author,
          fullName: author,
          profileUrl: `https://huggingface.co/${author}`,
          title: 'model author',
          raw: row,
        });
      }
      return { provider: this.id, status: 'ok', companies: [], people, jobs: [] };
    } catch (error) {
      return errored(this.id, error instanceof Error ? error.message : 'unknown error');
    }
  },
};

/** data.gov.sg Open Data API v2 — Singapore government datasets (market context). */
export const datagovsgAdapter: ProviderAdapter = {
  id: 'datagovsg',
  label: 'data.gov.sg',
  requiredEnv: [],
  async pull(_credentials: ProviderCredentials, options = {}): Promise<ProviderPullResult> {
    const limit = Math.min(options.limit ?? 10, 20);
    try {
      const url = new URL('https://api-production.data.gov.sg/v2/public/api/datasets');
      url.searchParams.set('page', '1');
      const response = await providerFetch('datagovsg', url);
      const json = await response.json() as {
        code?: number;
        data?: { datasets?: Array<Record<string, unknown>> };
        errorMsg?: string;
      };
      if (typeof json.code === 'number' && json.code !== 0) {
        return errored(this.id, json.errorMsg ?? `data.gov.sg code ${json.code}`);
      }
      const jobs = (json.data?.datasets ?? []).slice(0, limit).map((row, index) => ({
        provider: this.id,
        externalId: String(row.datasetId ?? row.id ?? `dgsg-${index}`),
        title: String(row.name ?? 'dataset'),
        companyName: row.managedByAgencyName ? String(row.managedByAgencyName) : 'data.gov.sg',
        location: 'Singapore',
        raw: row,
      }));
      return { provider: this.id, status: 'ok', companies: [], people: [], jobs };
    } catch (error) {
      return errored(this.id, error instanceof Error ? error.message : 'unknown error');
    }
  },
};
