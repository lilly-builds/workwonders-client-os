#!/usr/bin/env node
import { setupControlCenter } from './control-center.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);
if (!args.get('--out') || !args.get('--client') || !args.get('--project-id') || !args.get('--project-name')) {
  console.error('Usage: npm run setup -- --out <absolute-folder> --client <fake-client> --project-id <id> --project-name <fake-project>');
  process.exit(1);
}
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const result = await setupControlCenter({ outputDir: args.get('--out'), repoRoot, clientName: args.get('--client'), project: { id: args.get('--project-id'), name: args.get('--project-name') } });
console.log(`CONTROL CENTER READY: ${result.root}`);
console.log(`Created ${result.created.length} records; reused ${result.reused.length} existing records.`);
