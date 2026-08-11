import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const frontMatter = /^---\n([\s\S]*?)\n---/;

export async function loadTemplateDefinitions(templateDir) {
  const files = (await readdir(templateDir)).filter((file) => file.endsWith('.md') && file !== 'README.md').sort();
  const definitions = [];

  for (const file of files) {
    const text = await readFile(path.join(templateDir, file), 'utf8');
    const match = text.match(frontMatter);
    if (!match) throw new Error(`${file} is missing its required front matter.`);

    const type = match[1].match(/^record_type: (.+)$/m)?.[1]?.trim();
    const list = match[1].match(/^required_fields: \[(.+)\]$/m)?.[1];
    const requiredFields = list?.split(',').map((field) => field.trim()).filter(Boolean);

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
    definitions.push({ file, type, requiredFields, text });
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

  const status = record.status ?? record.verification_status;
  if (status === 'passed') {
    for (const field of ['check_method', 'evidence_reference', 'checked_by', 'checked_on']) {
      if (record[field] === undefined || record[field] === null || record[field] === '') {
        errors.push(`A passed item needs a checkable ${field}.`);
      }
    }
  }

  return errors;
}

export async function createDryRun({ templateDir, fixturePath, outputDir }) {
  const definitions = await loadTemplateDefinitions(templateDir);
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
  await mkdir(outputDir, { recursive: true });

  const created = [];
  for (const definition of definitions) {
    const record = fixture[definition.type];
    if (!record) throw new Error(`Fake data is missing a ${definition.type} record.`);
    const errors = validateRecord(record, definition);
    if (errors.length) throw new Error(`${definition.type}: ${errors.join(' ')}`);

    const body = `${definition.text.trimEnd()}\n\n## Fake local test data\n\n\`\`\`json\n${JSON.stringify(record, null, 2)}\n\`\`\`\n`;
    const outputFile = path.join(outputDir, definition.file);
    await writeFile(outputFile, body);
    created.push(outputFile);
  }
  return created;
}
