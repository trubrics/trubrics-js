import { readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json to get the version
const packageJsonPath = resolve(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Update the version.ts file
const versionFilePath = resolve(__dirname, '../src/utility/version.ts');
const versionFileContent = `// This file is auto-generated
export const SDK_VERSION = "${version}";
`;

writeFileSync(versionFilePath, versionFileContent, 'utf8');
console.log(`Updated version.ts with version ${version}`); 