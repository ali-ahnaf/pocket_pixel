# Pocket Pixel app

The offline Expo / React Native version of the expense tracker. All data lives in SQLite on the device.

## Gmail integration setup

Gmail import signs in with the native Google Sign-In SDK (`@react-native-google-signin/google-signin`), so it needs OAuth clients in a Google Cloud project you own. Until they exist, "Connect Gmail" fails and everything else in the app works as normal. Users don't bring their own client ID and secret like on the web: Google doesn't let a web client redirect back into a native app.

1. In Google Cloud Console, create or pick a project and enable the Gmail API.
2. Configure the OAuth consent screen as External, add the `https://www.googleapis.com/auth/gmail.readonly` scope, and add every tester's Google account as a test user.
3. Create an Android OAuth client with package name `com.pocketpixel.app` and the SHA-1 of the release keystore that EAS manages. Get the SHA-1 from `packages/app`:

   ```
   npm i -g eas-cli
   eas login
   eas build:configure          # creates eas.json and adds the EAS projectId to app.json
   eas credentials -p android   # pick the production profile, then "Keystore: Set up a new keystore"
   ```

   `eas credentials` prints the SHA-1. Every EAS build profile signs with this keystore by default, so one client covers all EAS builds. Local `npx expo run:android` builds sign with the debug key, and Google Sign-In fails on them, so build Android through EAS. If Google Play signs your releases, installs from the Play Store also need an Android client with the app signing SHA-1 from Play Console.

4. Create an iOS OAuth client with bundle ID `com.pocketpixel.app`.
5. Put the iOS client ID in `packages/app/.env`:

   ```
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com
   ```

   `app.config.ts` turns it into the iOS redirect URL scheme, and `src/lib/gmail/google-auth.ts` passes it to the SDK. `.env` is gitignored, so set the variable on any machine or CI job that builds the app. EAS doesn't upload `.env` either, so add it for cloud builds with `eas env:create`. Android needs no ID in code: Google matches the build to its client by package name and SHA-1.

6. Rebuild the native app: `npx expo run:ios` for iOS, `eas build -p android --profile preview` for an installable Android APK. Expo Go can't load the Sign-In SDK.

While the consent screen is in Testing mode, Google caps the app at 100 test users and expires each user's access 7 days after consent. The home screen then shows the reconnect banner. Releasing to the public means moving to Production, which needs Google's restricted-scope verification for `gmail.readonly`. Check with Google whether an app that keeps all Gmail data on the device also needs the yearly security assessment. We haven't confirmed that.
