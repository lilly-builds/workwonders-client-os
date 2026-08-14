#!/usr/bin/env node
import path from 'node:path';
import { runClientProjectCheck } from './checker.mjs';
const args = Object.fromEntries(process.argv.slice(2).reduce((all, item, i, list) => item.startsWith('--') ? [...all, [item.slice(2), list[i + 1]]] : all, []));
if (!args['control-center'] || !args['saved-copy'] || !args['test-library'] || !args['project-id'] || !args['project-name'] || !args.client) { console.error('Usage: npm run check --prefix tools/check-client-project -- --mode fake --control-center <folder> --saved-copy <fixture.json> --test-library <library.json> --client <name> --project-id <id> --project-name <name>'); process.exit(1); }
const repoRoot = path.resolve(new URL('../../../', import.meta.url).pathname);
const result = await runClientProjectCheck({ controlCenterDir: path.resolve(args['control-center']), savedCopyPath: path.resolve(args['saved-copy']), testLibraryPath: path.resolve(args['test-library']), clientName: args.client, project: { id: args['project-id'], name: args['project-name'], savedCopyLocation: args['saved-copy'] }, mode: args.mode || 'fake', repoRoot });
console.log(`Health check: ${result.status}. ${result.results.length - result.failed.length}/${result.results.length} tests passed.`);
if (result.deepCheck) console.log('A deep check was started for the first failed test; no live change was made.');
