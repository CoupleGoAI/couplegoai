# Android Releases

This repo now supports Android APK releases directly from commit messages on `main`.

## What it does

- Watches pushes to `main`
- Looks for a release token in the latest commit message
- Bumps `package.json`, `package-lock.json`, and `app.json`
- Increments `expo.android.versionCode`
- Creates a git tag like `android-v1.0.1`
- Builds an APK with EAS
- Publishes a GitHub Release with the APK attached

## How release detection works

The workflow supports both semantic release rules and explicit overrides.

### Automatic semantic releases

If the latest commit follows conventional commits, the workflow maps it like this:

- `feat:` -> `minor`
- `fix:` -> `patch`
- `feat!:` -> `major`
- any commit with `BREAKING CHANGE:` in the body -> `major`

Examples:

- `fix: profile save button overlap` -> patch release
- `feat: add shared prompts` -> minor release
- `feat!: redesign onboarding` -> major release
- `refactor: simplify auth store` -> no release
- `chore: update copy` -> no release
- `docs: tweak README` -> no release

### Explicit release overrides

Use either format in the commit subject or body to force a release regardless of commit type:

- `[release:android:patch]`
- `[release:android:minor]`
- `[release:android:major]`
- `release(android): patch`
- `release(android): minor`
- `release(android): major`

Examples:

- `chore: update copy [release:android:patch]`
- `docs: publish FAQs [release:android:minor]`
- `refactor: split chat state [release:android:patch]`

Explicit overrides win over semantic detection.

## One-time setup

1. Create an Expo access token and save it as the GitHub secret `EXPO_TOKEN`.
2. Run `npx eas-cli login` locally.
3. Run `npx eas-cli project:init` locally once so Expo writes the project metadata needed by CI.
4. Make sure Android credentials/keystore are configured in Expo when EAS prompts for them.
5. If `main` is branch-protected, allow GitHub Actions to push version bump commits and tags, or swap `GITHUB_TOKEN` for a PAT with repo write access.

## Manual local Android build

```bash
npx eas-cli build --platform android --profile production
```

That profile is configured in `eas.json` to generate an installable APK.

## Notes

- The workflow runs only on `main`.
- Commits without a matching semantic rule or explicit release token do nothing.
- The release commit created by the workflow uses `[skip ci]`, so the version bump commit does not loop into another release.
