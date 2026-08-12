#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDryRun } from './records.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');
const outputArg = process.argv.indexOf('--out');
const outputDir = outputArg >= 0 ? process.argv[outputArg + 1] : undefined;

if (!outputDir) {
  console.error('Usage: node src/dry-run.mjs --out <empty-local-folder>');
  process.exit(1);
}

const created = await createDryRun({
  templateDir: path.join(repoRoot, 'templates/troubleshooting'),
  fixturePath: path.join(repoRoot, 'tests/fixtures/troubleshooting-fake-records.json'),
  outputDir: path.resolve(outputDir),
  repoRoot,
});

console.log(`DRY RUN CREATED ${created.length} reusable records:`);
for (const file of created) console.log(`- ${path.basename(file)}`);
