import { loadConfig } from '@timur/runtime';
export function validateStartup() {
  try {
    loadConfig();
  } catch {
    // Next.js can retain its listener after a registration error; exit explicitly.
    console.error('Timur web startup rejected: invalid or unsafe runtime configuration');
    process.exit(1);
  }
}
