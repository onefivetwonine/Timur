export interface RuntimeConfig {
  environment: 'poc' | 'production';
  dataMode: 'synthetic' | 'controlled';
  aiProvider: 'deterministic';
  externalAiEnabled: false;
}

/** Reject unsafe configuration before opening a listener or accepting work. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const environment = env.TIMUR_ENVIRONMENT;
  if (environment !== 'poc' && environment !== 'production') {
    throw new Error('TIMUR_ENVIRONMENT must explicitly be poc or production');
  }
  const dataMode = env.TIMUR_DATA_MODE ?? 'synthetic';
  if (dataMode !== 'synthetic' && dataMode !== 'controlled') {
    throw new Error('TIMUR_DATA_MODE must be synthetic or controlled');
  }
  if (environment === 'poc' && dataMode !== 'synthetic') {
    throw new Error('POC requires synthetic data');
  }
  if ((env.TIMUR_EXTERNAL_AI_ENABLED ?? 'false') !== 'false') {
    throw new Error('External AI is disabled in this foundation');
  }
  if ((env.TIMUR_AI_PROVIDER ?? 'deterministic') !== 'deterministic') {
    throw new Error('Only the deterministic provider is allowed in this foundation');
  }
  return { environment, dataMode, aiProvider: 'deterministic', externalAiEnabled: false };
}

export function loadPort(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  return Number(value);
}
