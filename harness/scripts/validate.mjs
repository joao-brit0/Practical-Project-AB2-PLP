import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const requiredPaths = [
  'AGENTS.md',
  'docs/invariants.md',
  'eslint.config.js',
  'src/connectivity',
];
const errors = [];

for (const path of requiredPaths) {
  try {
    await stat(join(root, path));
  } catch {
    errors.push(`Missing required path: ${path}`);
  }
}

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(path)));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(path);
    }
  }

  return files;
}

try {
  const sourceFiles = await collectSourceFiles(join(root, 'src'));
  const tests = sourceFiles.filter((path) => /\.test\.(ts|tsx)$/.test(path));
  if (tests.length === 0) {
    errors.push('Expected at least one *.test.ts or *.test.tsx file under src/.');
  }

  for (const path of sourceFiles) {
    const content = await readFile(path, 'utf8');
    if (/@ts-ignore|@ts-expect-error|eslint-disable/.test(content)) {
      errors.push(`Forbidden suppression found in ${relative(root, path)}.`);
    }
  }
} catch (error) {
  errors.push(`Unable to validate source files: ${error.message}`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Harness structure and source suppression checks passed.');
}
