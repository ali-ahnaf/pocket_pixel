import { Href, useRouter } from 'expo-router';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../theme';

export type BackButtonVariant = 'default' | 'subtle';

export interface BackButtonProps {
  label?: string;
  /** Route to push instead of going back in history. */
  href?: Href;
  variant?: BackButtonVariant;
  style?: StyleProp<ViewStyle>;
}

export function BackButton({ label = 'Back', href, variant = 'default', style }: BackButtonProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={12}
      onPress={() => (href ? router.push(href) : router.back())}
      style={[styles.button, variant === 'subtle' && styles.subtleButton, style]}
    >
      {({ pressed }) => <Text style={[styles.label, variant === 'subtle' ? styles.subtleLabel : styles.defaultLabel, pressed && styles.pressedLabel]}>← {label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]), alignSelf: 'flex-start' },
  subtleButton: { alignSelf: 'center' },
  label: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(16), textTransform: 'uppercase', letterSpacing: 0.6 },
  defaultLabel: { color: color.onSurface },
  subtleLabel: { color: color.outline, fontSize: ms(11) },
  pressedLabel: { color: color.primary },
});
