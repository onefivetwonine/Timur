export const providerIds = [
  'crustdata',
  'dinq',
  'peopledatalabs',
  'apollo',
  'zoominfo',
  'cognism',
  'lusha',
  'theorg',
  'hunter',
  'proxycurl',
  'linkedin',
  'github',
  'huggingface',
  'opencorporates',
  'acra_bizfile',
  'mycareersfuture',
  'datagovsg',
] as const;

export type ProviderId = (typeof providerIds)[number];

export interface ProviderCredentials {
  /** Map of env-style keys already loaded (never log values). */
  env: NodeJS.ProcessEnv;
}

export interface CompanyHit {
  provider: ProviderId;
  externalId: string;
  name: string;
  domain?: string;
  country?: string;
  uen?: string;
  industry?: string;
  raw: unknown;
}

export interface PersonHit {
  provider: ProviderId;
  externalId: string;
  fullName?: string;
  title?: string;
  companyName?: string;
  profileUrl?: string;
  location?: string;
  raw: unknown;
}

export interface JobHit {
  provider: ProviderId;
  externalId: string;
  title: string;
  companyName?: string;
  uen?: string;
  location?: string;
  raw: unknown;
}

export interface ProviderPullResult {
  provider: ProviderId;
  status: 'ok' | 'skipped' | 'error';
  reason?: string;
  companies: CompanyHit[];
  people: PersonHit[];
  jobs: JobHit[];
}

export interface ProviderAdapter {
  id: ProviderId;
  /** Human label for logs/docs. */
  label: string;
  /** Env var names required for authenticated pulls (empty = public/no key). */
  requiredEnv: readonly string[];
  pull(credentials: ProviderCredentials, options?: { limit?: number }): Promise<ProviderPullResult>;
}
