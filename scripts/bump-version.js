import fs from 'fs';
import path from 'path';

const packageJsonPath = path.resolve('package.json');
const versionJsonPath = path.resolve('public/version.json');
const hookPath = path.resolve('src/hooks/useVersionCheck.ts');

// 1. Read package.json
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = pkg.version || '1.2.0';

// Calculate new version
const argVersion = process.argv[2];
let newVersion = '';

if (argVersion && /^\d+\.\d+\.\d+$/.test(argVersion)) {
  newVersion = argVersion;
} else {
  const parts = currentVersion.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  newVersion = parts.join('.');
}

// 2. Read and update version.json
let versionData = {
  version: newVersion,
  buildDate: new Date().toISOString(),
  buildNumber: 13,
  changelog: [],
};

if (fs.existsSync(versionJsonPath)) {
  try {
    versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
    versionData.buildNumber = (versionData.buildNumber || 0) + 1;
    versionData.version = newVersion;
    versionData.buildDate = new Date().toISOString();
  } catch (e) {
    // fallback
  }
}

// Update package.json
pkg.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

// Update public/version.json
fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2) + '\n', 'utf8');

// Update useVersionCheck.ts CURRENT_APP_VERSION
if (fs.existsSync(hookPath)) {
  let hookContent = fs.readFileSync(hookPath, 'utf8');
  hookContent = hookContent.replace(
    /export const CURRENT_APP_VERSION = '.*?';/,
    `export const CURRENT_APP_VERSION = '${newVersion}';`
  );
  hookContent = hookContent.replace(
    /export const CURRENT_BUILD_NUMBER = \d+;/,
    `export const CURRENT_BUILD_NUMBER = ${versionData.buildNumber};`
  );
  fs.writeFileSync(hookPath, hookContent, 'utf8');
}

console.log(`\n======================================================`);
console.log(`[SUCESSO] Versão atualizada: v${currentVersion} ➔ v${newVersion}`);
console.log(`Build Number: ${versionData.buildNumber}`);
console.log(`Data do Build: ${versionData.buildDate}`);
console.log(`Arquivos sincronizados:`);
console.log(`  - package.json`);
console.log(`  - public/version.json`);
console.log(`  - src/hooks/useVersionCheck.ts`);
console.log(`======================================================\n`);
