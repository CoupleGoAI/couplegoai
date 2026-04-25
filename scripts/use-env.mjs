#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sourceArg = process.argv[2] ?? '.env';
const sourcePath = resolve(process.cwd(), sourceArg);
const targetPath = resolve(process.cwd(), '.env.local');

if (!existsSync(sourcePath)) {
  console.error(`[use-env] source file not found: ${sourceArg}`);
  process.exit(1);
}

const content = readFileSync(sourcePath, 'utf8');
writeFileSync(targetPath, content);
console.log(`[use-env] wrote .env.local from ${sourceArg}`);
