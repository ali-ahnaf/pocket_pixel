import { Anybody_800ExtraBold } from '@expo-google-fonts/anybody';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { DatabaseProvider } from '../hooks/DatabaseProvider';
import { color } from '../theme';

// Shows Expo Router's error screen (with Retry) when DatabaseProvider throws, e.g. if the DB cannot be set up.
export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const [loaded] = useFonts({ Anybody_800ExtraBold, Inter_400Regular, Inter_700Bold, JetBrainsMono_700Bold });
  if (!loaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <DatabaseProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }} />
      </DatabaseProvider>
    </>
  );
}
