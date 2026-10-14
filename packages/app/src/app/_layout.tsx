import { Anybody_800ExtraBold } from '@expo-google-fonts/anybody';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../hooks/AuthProvider';
import { DatabaseProvider } from '../hooks/DatabaseProvider';
import { color } from '../theme';

// Shows Expo Router's error screen (with Retry) when DatabaseProvider throws, e.g. if the DB cannot be set up.
export { ErrorBoundary } from 'expo-router';

// Signed-out users only reach the auth screens, signed-in users only reach the app. Routes not listed here stay open.
function RootStack() {
  const { userId } = useAuth();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
      <Stack.Protected guard={!userId}>
        <Stack.Screen name="signin" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
      <Stack.Protected guard={!!userId}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/ai" />
        <Stack.Screen name="settings/attributions" />
        <Stack.Screen name="settings/google-oauth" />
        <Stack.Screen name="views/table" />
        <Stack.Screen name="auth/google/callback" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({ Anybody_800ExtraBold, Inter_400Regular, Inter_700Bold, JetBrainsMono_700Bold });
  if (!loaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <DatabaseProvider>
        <AuthProvider>
          <RootStack />
        </AuthProvider>
      </DatabaseProvider>
    </>
  );
}
