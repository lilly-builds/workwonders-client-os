#!/usr/bin/env node
import path from 'node:path';
import { investigate } from './investigate.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((all, item, index, list) => item.startsWith('--') ? [...all, [item.slice(2), list[index + 1]]] : all, []));
if (!args['control-center'] || !args['saved-copy'] || !args['project-id'] || !args['project-name'] || !args.client || !args.complaint || !args['issue-id']) {
  console.error('Usage: npm run debug --prefix tools/debug-client-project -- --mode fake --control-center <folder> --saved-copy <fixture.json> --client <name> --project-id <id> --project-name <name> --issue-id <id> --complaint <words>'); process.exit(1);
}
console.log('I will check the saved copy safely. I will explain each check, ask one question at a time when a choice matters, and will not touch a live project.');
console.log('I am checking the complaint, the likely causes, and the evidence in order.');
const result = await investigate({ controlCenterDir: path.resolve(args['control-center']), savedCopyPath: path.resolve(args['saved-copy']), clientName: args.client, project: { id: args['project-id'], name: args['project-name'], savedCopyLocation: args['saved-copy'] }, complaint: args.complaint, issueId: args['issue-id'], mode: args.mode || 'fake', operator: args.operator || 'Lilly', clientOwner: args['client-owner'] || 'named client owner' });
console.log(`Here is what I found: ${result.summary.known}`);
console.log(`I did not check: ${result.summary.unknown}`);
console.log(`Next owner: ${result.summary.nextOwner}`);
console.log(`Next action: ${result.summary.nextAction}`);
console.log(`Saved one issue record and one Troubleshooting Card in ${result.result.root}.`);
