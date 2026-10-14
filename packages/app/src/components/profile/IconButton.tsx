import { Pressable, StyleSheet, Text } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, shadow } from '../../theme';

export interface IconButtonProps {
  glyph: string;
  label: string;
  variant?: 'ghost' | 'danger';
  onPress: () => void;
}

// Small square edit/delete button used on profile cards.
export function IconButton({ glyph, label, variant = 'ghost', onPress }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.base, variant === 'danger' ? styles.danger : styles.ghost, pressed && styles.pressed]}
    >
      <Text style={[styles.glyph, variant === 'danger' && styles.dangerGlyph]}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { width: ms(32), height: ms(32), alignItems: 'center', justifyContent: 'center', borderWidth: ms(2), borderColor: color.border },
  ghost: { backgroundColor: color.surfaceHighest, boxShadow: shadow.button.ghost },
  danger: { backgroundColor: color.errorContainer, boxShadow: shadow.button.ghost },
  pressed: { boxShadow: shadow.button.pressed, transform: [{ translateY: 2 }] },
  glyph: { fontFamily: font.bodyBold, fontSize: ms(16), color: color.onSurface },
  dangerGlyph: { color: color.onErrorContainer },
});
