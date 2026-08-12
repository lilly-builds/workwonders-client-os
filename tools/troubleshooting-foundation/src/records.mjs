import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const frontMatter = /^---\n([\s\S]*?)\n---/;
const idFieldByType = {
  'Project Register': 'project_id',
  'Issue & Fix Log': 'issue_id',
  'Trusted Sources': 'source_id',
  'Test Library': 'test_id',
  'Troubleshooting Card': 'card_id',
  'Data Integrity Report': 'report_id',
  'Developer Ticket': 'ticket_id',
  'Release Record': 'release_id',
};

function parseList(header, field) {
  const value = header.match(new RegExp(`^${field}: \\[(.+)\\]$`, 'm'))?.[1];
  return value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
}

export async function loadTemplateDefinitions(templateDir) {
  const files = (await readdir(templateDir)).filter((file) => file.endsWith('.md') && file !== 'README.md').sort();
  const definitions = [];

  for (const file of files) {
    const text = await readFile(path.join(templateDir, file), 'utf8');
    const match = text.match(frontMatter);
    if (!match) throw new Error(`${file} is missing its required front matter.`);

    const type = match[1].match(/^record_type: (.+)$/m)?.[1]?.trim();
    const requiredFields = parseList(match[1], 'required_fields');
    const allowedStatuses = parseList(match[1], 'allowed_statuses');

    if (!type || !requiredFields?.length) {
      throw new Error(`${file} must declare record_type and required_fields.`);
    }
    if (text.includes('passed')) {
      const checkableFields = ['check_method', 'evidence_reference', 'checked_by', 'checked_on'];
      const missingCheckableFields = checkableFields.filter((field) => !requiredFields.includes(field));
      if (missingCheckableFields.length) {
        throw new Error(`${file} allows passed but is missing required checkable fields: ${missingCheckableFields.join(', ')}.`);
      }
    }
    definitions.push({ file, type, requiredFields, allowedStatuses, text });
  }

  return definitions;
}

export function validateRecord(record, definition) {
  const errors = [];
  for (const field of definition.requiredFields) {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  const status = record.status ?? record.verification_status ?? record.overall_status;
  if (definition.allowedStatuses.length && status && !definition.allowedStatuses.includes(status)) {
    errors.push(`Invalid status: ${status}. Allowed values: ${definition.allowedStatuses.join(', ')}.`);
  }
  if (status === 'passed') {
    for (const field of ['check_method', 'evidence_reference', 'checked_by', 'checked_on']) {
      if (record[field] === undefined || record[field] === null || record[field] === '') {
        errors.push(`A passed item needs a checkable ${field}.`);
      }
    }
  }

  return errors;
}

export function validateRecordCollection(records, definitions) {
  const errors = [];
  const seenIds = new Map();
  const definitionsByType = new Map(definitions.map((definition) => [definition.type, definition]));

  for (const record of records) {
    const definition = definitionsByType.get(record.record_type);
    if (!definition) {
      errors.push(`Unknown record type: ${record.record_type}.`);
      continue;
    }
    errors.push(...validateRecord(record, definition).map((error) => `${record.record_type}: ${error}`));
    const idField = idFieldByType[record.record_type];
    if (!idField || !record[idField]) continue;
    if (seenIds.has(record[idField])) {
      errors.push(`Duplicate record ID: ${record[idField]} (${seenIds.get(record[idField])} and ${record.record_type}).`);
    } else {
      seenIds.set(record[idField], record.record_type);
    }
  }
  return errors;
}

export function assertOutputOutsideRepository(outputDir, repoRoot) {
  const resolvedOutput = path.resolve(outputDir);
  const resolvedRepo = path.resolve(repoRoot);
  if (resolvedOutput === resolvedRepo || resolvedOutput.startsWith(`${resolvedRepo}${path.sep}`)) {
    throw new Error('Dry-run output must be outside the repository to prevent accidental fixture writes.');
  }
}

export async function createDryRun({ templateDir, fixturePath, outputDir, repoRoot }) {
  assertOutputOutsideRepository(outputDir, repoRoot ?? path.resolve(templateDir, '../..'));
  const definitions = await loadTemplateDefinitions(templateDir);
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
  await mkdir(outputDir, { recursive: true });

  const created = [];
  for (const definition of definitions) {
    const record = fixture[definition.type];
    if (!record) throw new Error(`Fake data is missing a ${definition.type} record.`);
    const errors = validateRecord(record, definition);
    if (errors.length) throw new Error(`${definition.type}: ${errors.join(' ')}`);

    const body = `> **FICTIONAL LOCAL TEST DATA — NOT CLIENT MATERIAL**\n\n${definition.text.trimEnd()}\n\n## Fictional local test data\n\n\`\`\`json\n${JSON.stringify(record, null, 2)}\n\`\`\`\n`;
    const outputFile = path.join(outputDir, definition.file);
    await writeFile(outputFile, body);
    created.push(outputFile);
  }
  return created;
}
