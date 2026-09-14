import { loadConfig } from '@timur/runtime';
export default function Home() {
  const config = loadConfig();
  return <main>
    <p className="eyebrow">Timur</p>
    <h1>Human Talent Decision Intelligence</h1>
    <p>This workspace establishes the application and infrastructure foundation.</p>
    <dl>
      <div><dt>Environment</dt><dd>{config.environment}</dd></div>
      <div><dt>Data mode</dt><dd>{config.dataMode}</dd></div>
      <div><dt>External AI</dt><dd>Disabled</dd></div>
    </dl>
    <p>Candidate ingestion, ranking, authentication and hiring workflows are pending implementation. No personal data should be entered here.</p>
  </main>;
}
