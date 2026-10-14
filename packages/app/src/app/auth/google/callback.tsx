// STUB: Google OAuth callback (no session is stored; a token param just redirects home). No local data layer for this in packages/app yet, so it uses hardcoded stub data.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { PixelLoader } from '../../../components/PixelLoader';
import { color, font, space } from '../../../theme';

export default function GoogleCallbackScreen() {
  const router = useRouter();
  const { token, error } = useLocalSearchParams<{ token?: string; error?: string }>();
  const failed = !!error || !token;

  useEffect(() => {
    if (failed) {
      const timer = setTimeout(() => router.replace('/signin'), 2000);
      return () => clearTimeout(timer);
    }
    router.replace('/');
  }, [router, failed]);

  if (failed) {
    return (
      <View style={styles.failed}>
        <Text style={styles.failedText} accessibilityRole="alert">
          Google sign-in failed, redirecting…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <PixelLoader />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  failed: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: ms(space[4]), backgroundColor: color.bg },
  failedText: { fontFamily: font.mono, fontSize: ms(13), color: color.primary, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' },
});
