import { readFileSync } from 'node:fs';
import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
export type * from './generated.js';

export const contractNames = [
  'opportunity-twin', 'evidence-claim', 'authority-grant', 'decision-envelope', 'domain-event',
] as const;
export type ContractName = (typeof contractNames)[number];

const ajv = new Ajv2020({ allErrors: true, strict: false });
// The upstream drafts use nullable unions; validate drafts unchanged and apply
// stricter tenant checks at this boundary rather than silently changing assets.
const formats = addFormats as unknown as (instance: Ajv2020) => void;
formats(ajv);
const validators = Object.fromEntries(contractNames.map((name) => [
  name, ajv.compile(JSON.parse(readFileSync(new URL(`../schemas/${name}.schema.json`, import.meta.url), 'utf8'))),
]));

export function validateContract(name: ContractName, value: unknown, expectedTenant: string):
  { valid: true } | { valid: false; errors: string[] } {
  if (!expectedTenant.trim()) return { valid: false, errors: ['tenant context is required'] };
  const validate = validators[name];
  if (!validate || !validate(value)) {
    return { valid: false, errors: validate?.errors?.map(e => `${e.instancePath || '/'}: ${e.keyword}`) ?? ['unknown contract'] };
  }
  if ((value as { tenant_id: string }).tenant_id !== expectedTenant) {
    return { valid: false, errors: ['tenant context mismatch'] };
  }
  return { valid: true };
}
