export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateStartup } = await import('./instrumentation-node');
    validateStartup();
  }
}
