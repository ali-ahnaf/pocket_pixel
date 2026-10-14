import type { ConfigContext, ExpoConfig } from 'expo/config';

// Google Sign-In without Firebase. iOS redirects back through the iOS OAuth client id reversed, so the id is read once
// from EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (also used by src/lib/gmail/google-auth.ts). Android needs no id: Google matches
// the build to its Android OAuth client by package name and SHA-1.
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const iosUrlScheme = `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`;

// app.json still holds the rest of the config, including name and slug.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  plugins: [...(config.plugins ?? []), ['@react-native-google-signin/google-signin', { iosUrlScheme }]],
});
