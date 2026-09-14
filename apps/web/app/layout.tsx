import type { Metadata } from 'next';
import { loadConfig } from '@timur/runtime';
import './styles.css';

export const metadata: Metadata = { title: 'Timur | Foundation', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const config = loadConfig();
  return <html lang="en"><body>
    <aside role="status" className="environment-banner">
      {config.environment === 'poc'
        ? 'POC · Synthetic data only · Not for production decisions'
        : 'Production environment · Foundation only · Recruitment workflows unavailable'}
    </aside>
    {children}
  </body></html>;
}
