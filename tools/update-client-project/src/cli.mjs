#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { previewUpdate } from './update.mjs';

const input = process.argv[2];
if (!input) {
  console.error('Usage: node cli.mjs <sanitized-request.json>');
  process.exit(2);
}
const request = JSON.parse(readFileSync(input, 'utf8'));
if (request.write === true) {
  console.error('Live writes are disabled in this phase. Use write:false for a preview.');
  process.exit(1);
}
if (!request.live || !request.proposed || !request.live_project_id) {
  console.error('Preview requires live_project_id, live, and proposed files.');
  process.exit(2);
}
if (request.live.uuid !== request.live_project_id) {
  console.error(`Wrong target project: expected exact project ID ${request.live_project_id}.`);
  process.exit(1);
}
console.log(JSON.stringify({ status: 'preview-only', preview: previewUpdate(request), message: 'No project was changed.' }, null, 2));
