import { readFile, readdir, writeFile } from 'node:fs/promises';
import { compile } from 'json-schema-to-typescript';

const root = new URL('../', import.meta.url);
let output = '// Generated from the GitBook draft schemas. Run npm run contracts:generate.\n';
for (const name of (await readdir(new URL('schemas/', root))).sort()) {
  if (!name.endsWith('.schema.json')) continue;
  const schema = JSON.parse(await readFile(new URL(`schemas/${name}`, root), 'utf8'));
  output += await compile(schema, schema.title, { bannerComment: '', unknownAny: true });
  output += '\n';
}
await writeFile(new URL('src/generated.ts', root), output);
