# Shivansh — Android App (Play Store)

This project is set up as a **PWA + TWA (Trusted Web Activity)** to produce a real Android app for the Google Play Store.

## Prerequisites

1. **Node.js LTS** installed on your computer
2. **Android Studio** (for the Android SDK)
3. **JDK 17** (for signing the app)
4. A deployed HTTPS URL for your web app (e.g., `https://shivansh.app`)
5. A **Google Play Developer account** ($25 one-time fee at https://play.google.com/apps/publish/signup)

## Step 1 — Deploy your web app

Your web app must be live on a public HTTPS URL. The PWA manifest and service worker are already configured.

```bash
npm run build
# Deploy the dist/ folder to your hosting provider
```

## Step 2 — Update the domain

In `twa-manifest.json`, replace all occurrences of `shivansh.app` with your actual deployed domain.

## Step 3 — Install Bubblewrap CLI

Google's official tool that wraps a PWA into an Android app:

```bash
npm install -g @bubblewrap/cli
```

## Step 4 — Generate the Android project

```bash
bubblewrap init --manifest https://your-domain.com/manifest.webmanifest
```

This reads your PWA manifest and creates a full Android project in the current directory.

## Step 5 — Build the AAB (Android App Bundle)

```bash
bubblewrap build
```

This produces an `.aab` file (Android App Bundle) — the format Google Play requires. You'll be prompted to create or use a signing keystore. Keep this keystore safe — you need it for every future update.

## Step 6 — Upload to Google Play

1. Go to https://play.google.com/console
2. Click **Create app**
3. Fill in the app details (use the text in `play-store-listing.md`)
4. Go to **Production** → **Create new release**
5. Upload your `.aab` file
6. Complete the **Store listing**, **Content rating**, and **Privacy policy** sections
7. Submit for review (usually 1-3 days)

## App signing

When you first upload, Google Play will ask you to enroll in **App Signing by Google Play**. Accept it — Google will manage your signing key. Keep your local `.keystore` file safe as a backup.

## Updating the app later

1. Make changes to your web app
2. Deploy the updated web app
3. Bump `appVersionCode` and `appVersionName` in `twa-manifest.json`
4. Run `bubblewrap build` again
5. Upload the new `.aab` to Google Play as a new release

## Files in this project

| File | Purpose |
|------|---------|
| `twa-manifest.json` | TWA configuration (package ID, icons, shortcuts) |
| `play-store-listing.md` | Store listing text (title, description, etc.) |
| `android/assets/icons/` | PNG app icons (48, 192, 512px) |
| `vite.config.ts` | PWA manifest + service worker config |
| `public/logos/shivansh-app-icon-512.png` | 512px icon for Play Store |

## Need an APK instead of AAB?

For testing on your own device before the Play Store:

```bash
bubblewrap build --apk
```
