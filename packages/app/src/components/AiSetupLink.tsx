import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, text } from '../theme';

/** "Go to settings" link shown when AI parsing needs an OpenRouter key or model. `onPress` runs first, e.g. to close the sheet. */
export function AiSetupLink({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      hitSlop={10}
      onPress={() => {
        onPress?.();
        router.push('/settings/ai');
      }}
    >
      <Text style={styles.link}>GO TO SETTINGS</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.primary, textDecorationLine: 'underline' },
});
