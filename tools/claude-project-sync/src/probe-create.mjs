// Can the tool create a project? Find out by using the real "New project"
// button and recording what the site asks for, rather than guessing endpoint
// names.
//
//   node src/probe-create.mjs --port 9223
//
// Creates one obviously-disposable project. Prints the endpoint it used, and
// the endpoint the UI uses to delete, if we can see it.

import { connect, goto, parseArgs } from './session.mjs';

const args = parseArgs();
const port = args.port ?? 9223;
const NAME = 'ZZ DELETE ME - api probe';

const { browser, page, close } = await connect(port);
const calls = [];

page.on('request', (req) => {
  const url = req.url();
  if (!url.includes('claude.ai/api/')) return;
  const m = req.method();
  if (m === 'GET') return; // we already know the reads
  calls.push({ method: m, url, body: req.postData()?.slice(0, 300) ?? null });
});

try {
  await goto(page, 'https://claude.ai/projects', 5000);

  const newBtn = page
    .locator('button, a')
    .filter({ hasText: /^\s*New project\s*$/i })
    .first();
  await newBtn.click({ timeout: 10000 });
  await page.waitForTimeout(1500);

  // Name field in the create dialog.
  const nameField = page.locator('input[type="text"], input:not([type])').first();
  await nameField.fill(NAME, { timeout: 8000 });
  await page.waitForTimeout(400);

  const submit = page
    .locator('button')
    .filter({ hasText: /^\s*(Create project|Create)\s*$/i })
    .first();
  await submit.click({ timeout: 8000 });
  await page.waitForTimeout(5000);

  console.log('landed on:', page.url());
} catch (e) {
  console.log('UI walk failed:', e.message.split('\n')[0]);
} finally {
  console.log('\n=== non-GET calls observed ===');
  if (!calls.length) console.log('(none)');
  for (const c of calls) {
    console.log(`\n${c.method} ${new URL(c.url).pathname}`);
    if (c.body) console.log(`   body: ${c.body}`);
  }
  await close();
}
