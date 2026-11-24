import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function checkExists(relPath, label) {
  if (!fs.existsSync(path.join(root, relPath))) {
    errors.push(`Arquivo ou pasta obrigatória ausente (${label}): ${relPath}`);
  }
}

function getAllSourceFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

checkExists('AGENTS.md', 'Contrato do Agente');
checkExists('docs/invariants.md', 'Invariantes Arquiteturais');
checkExists('eslint.config.js', 'Configuração ESLint');
checkExists('src/connectivity', 'Camada Reativa de Conectividade');

const srcFiles = getAllSourceFiles(path.join(root, 'src'));
const connectivityFiles = srcFiles.filter((f) => f.includes(`${path.sep}connectivity${path.sep}`));
const testFiles = srcFiles.filter((f) => /\.test\.(ts|tsx)$/.test(f));

if (connectivityFiles.length === 0) {
  errors.push('Violação arquitetural: Nenhum módulo encontrado em src/connectivity/.');
}
if (testFiles.length === 0) {
  errors.push('Violação de qualidade: Nenhum arquivo de teste (*.test.ts/tsx) encontrado em src/.');
}

const forbiddenPatterns = [
  { regex: /@ts-ignore/, label: '@ts-ignore' },
  { regex: /@ts-expect-error/, label: '@ts-expect-error' },
  { regex: /eslint-disable/, label: 'eslint-disable' },
];

for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  for (const pattern of forbiddenPatterns) {
    if (pattern.regex.test(content)) {
      errors.push(`Supressão proibida (${pattern.label}) encontrada em: ${rel}`);
    }
  }
}

if (errors.length > 0) {
  console.error('\n❌ Falha na validação arquitetural do Harness:\n');
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log('\n✅ Validação arquitetural do Harness concluída com sucesso!\n');
