import { errored, providerFetch, requireEnv, skipped } from './http.js';
import type { PersonHit, ProviderAdapter, ProviderCredentials, ProviderPullResult } from './types.js';

/**
 * DINQ talent search — requirement-driven people discovery across public sources.
 * Do not treat DINQ ranking or outreach copy as Timur decision authority.
 */
export const dinqAdapter: ProviderAdapter = {
  id: 'dinq',
  label: 'DINQ',
  requiredEnv: ['DINQ_API_KEY'],
  async pull({ env }: ProviderCredentials, options = {}): Promise<ProviderPullResult> {
    const missing = requireEnv(env, this.requiredEnv);
    if (missing) return skipped(this.id, `missing ${missing}`);
    const limit = Math.min(options.limit ?? 10, 25);
    try {
      const response = await providerFetch('dinq', 'https://api.dinq.me/v2/people/search', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.DINQ_API_KEY}`,
          'content-type': 'application/json',
          'user-agent': 'timur-providers/0.1',
        },
        body: JSON.stringify({
          query: 'Singapore software engineer with AI or platform experience',
          limit,
          sources: ['github', 'huggingface', 'linkedin', 'scholar'],
        }),
      });
      const json = await response.json() as {
        code?: number;
        message?: string;
        data?: { results?: Array<Record<string, unknown>> };
      };
      if (typeof json.code === 'number' && json.code !== 0) {
        return errored(this.id, json.message ?? `DINQ code ${json.code}`);
      }
      const rows = json.data?.results ?? [];
      const people: PersonHit[] = rows.map((row, index) => {
        const name = String(row.name ?? row.full_name ?? row.display_name ?? `dinq-${index}`);
        const id = String(row.id ?? row.profile_id ?? row.url ?? name);
        return {
          provider: this.id,
          externalId: id,
          fullName: name,
          title: row.title || row.headline ? String(row.title ?? row.headline) : undefined,
          companyName: row.company || row.organization
            ? String(row.company ?? row.organization)
            : undefined,
          profileUrl: row.url || row.profile_url || row.linkedin_url
            ? String(row.url ?? row.profile_url ?? row.linkedin_url)
            : undefined,
          location: row.location ? String(row.location) : undefined,
          raw: row,
        };
      });
      return { provider: this.id, status: 'ok', companies: [], people, jobs: [] };
    } catch (error) {
      return errored(this.id, error instanceof Error ? error.message : 'unknown error');
    }
  },
};

/**
 * LinkedIn has no open people-search key for this POC.
 * Prefer Crustdata/Proxycurl/DINQ with LinkedIn URLs stored on subjects.
 */
export const linkedinAdapter: ProviderAdapter = {
  id: 'linkedin',
  label: 'LinkedIn (via enrichers)',
  requiredEnv: [],
  async pull({ env }: ProviderCredentials): Promise<ProviderPullResult> {
    if (env.PROXYCURL_API_KEY?.trim() || env.CRUSTDATA_API_KEY?.trim() || env.DINQ_API_KEY?.trim()) {
      return skipped(
        this.id,
        'no direct LinkedIn API in Timur; use proxycurl/crustdata/dinq (keys already present for at least one)',
      );
    }
    return skipped(
      this.id,
      'no direct LinkedIn API — add PROXYCURL_API_KEY, CRUSTDATA_API_KEY, or DINQ_API_KEY to enrich LinkedIn URLs',
    );
  },
};
