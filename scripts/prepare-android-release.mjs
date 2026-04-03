import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const COMMIT_MESSAGE = process.env.COMMIT_MESSAGE ?? '';
const outputPath = process.env.GITHUB_OUTPUT;

const explicitReleaseMatch =
  COMMIT_MESSAGE.match(/\[release:android:(patch|minor|major)\]/i) ??
  COMMIT_MESSAGE.match(/release\(android\):\s*(patch|minor|major)/i);

const bumpType = resolveBumpType(COMMIT_MESSAGE, explicitReleaseMatch);

if (!bumpType) {
  writeOutputs({
    should_release: 'false',
  });
  process.exit(0);
}
const appJsonPath = new URL('../app.json', import.meta.url);
const packageJsonPath = new URL('../package.json', import.meta.url);

const appJson = JSON.parse(readFileSync(appJsonPath, 'utf8'));
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

const currentVersion = String(appJson.expo?.version ?? packageJson.version ?? '1.0.0');
const nextVersion = bumpVersion(currentVersion, bumpType);
const currentVersionCode = Number(appJson.expo?.android?.versionCode ?? 0);
const nextVersionCode = currentVersionCode + 1;

execFileSync('npm', ['version', nextVersion, '--no-git-tag-version'], {
  stdio: 'inherit',
});

const updatedAppJson = JSON.parse(readFileSync(appJsonPath, 'utf8'));
updatedAppJson.expo.version = nextVersion;
updatedAppJson.expo.android = {
  ...(updatedAppJson.expo.android ?? {}),
  versionCode: nextVersionCode,
};

writeFileSync(appJsonPath, `${JSON.stringify(updatedAppJson, null, 2)}\n`);

writeOutputs({
  should_release: 'true',
  release_type: bumpType,
  version: nextVersion,
  version_code: String(nextVersionCode),
  tag: `android-v${nextVersion}`,
  release_name: `Android v${nextVersion}`,
  release_commit_message: `chore(release): android v${nextVersion} [skip ci]`,
});

function bumpVersion(version, bump) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);

  if (!match) {
    throw new Error(
      `Expected expo.version to use semver (x.y.z), received "${version}".`
    );
  }

  const [, majorRaw, minorRaw, patchRaw] = match;
  const major = Number(majorRaw);
  const minor = Number(minorRaw);
  const patch = Number(patchRaw);

  if (bump === 'major') {
    return `${major + 1}.0.0`;
  }

  if (bump === 'minor') {
    return `${major}.${minor + 1}.0`;
  }

  return `${major}.${minor}.${patch + 1}`;
}

function resolveBumpType(commitMessage, explicitMatch) {
  if (explicitMatch) {
    return explicitMatch[1].toLowerCase();
  }

  const subject = commitMessage.split('\n')[0]?.trim() ?? '';
  const conventionalMatch = subject.match(
    /^(?<type>[a-z]+)(?:\([^)]+\))?(?<breaking>!)?:\s+/i
  );

  const hasBreakingChangeFooter = /BREAKING CHANGE:/i.test(commitMessage);

  if (conventionalMatch?.groups?.breaking || hasBreakingChangeFooter) {
    return 'major';
  }

  const commitType = conventionalMatch?.groups?.type?.toLowerCase();

  if (commitType === 'feat') {
    return 'minor';
  }

  if (commitType === 'fix') {
    return 'patch';
  }

  return null;
}

function writeOutputs(values) {
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`);

  if (outputPath) {
    writeFileSync(outputPath, `${lines.join('\n')}\n`, { flag: 'a' });
  }

  for (const line of lines) {
    console.log(line);
  }
}
