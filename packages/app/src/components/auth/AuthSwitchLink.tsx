import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';

export interface AuthSwitchLinkProps {
  prompt: string;
  label: string;
  onPress: () => void;
  /** Prompt and link on one line instead of stacked. */
  inline?: boolean;
}

// "New adventurer? Create Account" style link under the sign in and sign up cards.
export function AuthSwitchLink({ prompt, label, onPress, inline = false }: AuthSwitchLinkProps) {
  return (
    <View style={[styles.container, inline && styles.inline]}>
      <Text style={styles.prompt}>{prompt}</Text>
      <Pressable accessibilityRole="link" accessibilityLabel={label} hitSlop={12} onPress={onPress}>
        {({ pressed }) => <Text style={[styles.link, pressed && styles.pressed]}>{label}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: ms(space[1]) },
  inline: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(space[2]) },
  prompt: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurfaceVariant },
  link: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(16), color: color.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  pressed: { textDecorationLine: 'underline' },
});
