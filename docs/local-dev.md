# Local Development

For full local setup instructions see [local-dev-setup.md](./local-dev-setup.md).

---

## Triggering an Android release

The CI/CD pipeline builds and publishes a signed APK automatically when a commit message on `main` includes the release token recognised by `npm run release:android:prepare`.

### Steps

1. Make sure all Android signing secrets are configured in the repository:
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`

2. Include the release token in your commit message (see `scripts/release-android-prepare.js` for the exact token format).

3. Push to `main`. The pipeline will:
   - Run Node and SQL tests
   - Deploy Supabase migrations, edge functions, and prompt templates
   - Bump the version, build the APK, and publish a GitHub release

The APK is attached to the GitHub release created for that tag.

### Manual trigger

You can also trigger the workflow manually from the **Actions** tab → **CI/CD Pipeline** → **Run workflow**.
