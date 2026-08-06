// Discovery pass. Read-only, changes nothing.
//
// Loads the projects list (and optionally one project) in the automation Chrome
// and records every claude.ai API call the page makes. The point is to learn how
// the app itself reads a project, so the exporter can ask the same questions
// instead of scraping rendered HTML.
//
//   node src/discover.mjs --port 9223
//   node src/discover.mjs --port 9223 --project <project-url>

import { writeFileSync } from 'fs';
import { connect, goto, parseArgs } from './session.mjs';

const args = parseArgs();
const port = args.port ?? 9223;
const projectUrl = args.project ?? args._[0] ?? null;

const shape = (v, depth = 0) => {
  if (v === null) return 'null';
  if (Array.isArray(v))
    return depth > 1
      ? `array(${v.length})`
      : `array(${v.length}) of ${v.length ? shape(v[0], depth + 1) : '?'}`;
  if (typeof v === 'object') {
    if (depth > 1) return `object{${Object.keys(v).length} keys}`;
    return `{ ${Object.entries(v)
      .map(([k, x]) => `${k}: ${shape(x, depth + 1)}`)
      .join(', ')} }`;
  }
  if (typeof v === 'string') return v.length > 60 ? `string(${v.length})` : 'string';
  return typeof v;
};

const { browser, page } = await connect(port);
const seen = new Map();

page.on('response', async (res) => {
  const url = res.url();
  if (!url.includes('claude.ai/api/')) return;
  // Collapse uuids so repeated calls to one endpoint group together.
  const key =
    res.request().method() +
    ' ' +
    new URL(url).pathname.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, '{uuid}');
  if (seen.has(key)) return;
  const entry = { key, url, status: res.status(), shape: null, sample: null };
  seen.set(key, entry);
  try {
    const body = await res.json();
    entry.shape = shape(body);
    entry.sample = body;
  } catch {
    entry.shape = '(not json)';
  }
});

console.log(`>>> projects list`);
console.log('    landed on:', await goto(page, 'https://claude.ai/projects', 6000));

if (projectUrl) {
  console.log(`\n>>> single project`);
  console.log('    landed on:', await goto(page, projectUrl, 7000));
}

console.log('\n================ CLAUDE.AI API CALLS SEEN ================');
const entries = [...seen.values()].sort((a, b) => a.key.localeCompare(b.key));
for (const e of entries) {
  console.log(`\n${e.status}  ${e.key}`);
  console.log(`      ${e.shape}`);
}

writeFileSync(
  new URL('../exports/_discovery.json', import.meta.url),
  JSON.stringify(entries, null, 2)
);
console.log(`\n${entries.length} endpoints. Full bodies in exports/_discovery.json`);

await browser.close();
