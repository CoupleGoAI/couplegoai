import { readFileSync } from 'node:fs';

const buildFilePath = process.argv[2];

if (!buildFilePath) {
  throw new Error('Usage: node scripts/get-eas-build-url.mjs <build-json-file>');
}

const parsed = JSON.parse(readFileSync(buildFilePath, 'utf8'));
const build = Array.isArray(parsed) ? parsed[0] : parsed;

const buildUrl =
  build?.artifacts?.buildUrl ??
  build?.artifacts?.applicationArchiveUrl ??
  build?.artifacts?.url ??
  build?.buildUrl;

if (!buildUrl) {
  throw new Error(
    'Could not find an Android artifact URL in the EAS build output. Check build.json.'
  );
}

process.stdout.write(`${buildUrl}\n`);
