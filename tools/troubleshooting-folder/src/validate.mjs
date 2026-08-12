#!/usr/bin/env node
import { validateControlCenter } from './control-center.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outputDir = process.argv[2];
if (!outputDir) {
  console.error('Usage: npm run validate --prefix tools/troubleshooting-folder -- <absolute-folder>');
  process.exit(1);
}
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const errors = await validateControlCenter(outputDir, { repoRoot });
if (errors.length) {
  console.error(`CONTROL CENTER INVALID (${errors.length} problem${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`CONTROL CENTER VALID: ${outputDir}`);
