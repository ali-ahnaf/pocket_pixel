import { Pressable, StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, shadow } from '../../theme';
import { PixelIcon, PixelIconName } from '../PixelIcon';

export interface IconButtonProps {
  icon: PixelIconName;
  label: string;
  variant?: 'ghost' | 'danger';
  onPress: () => void;
}

// Small square edit/delete button used on profile cards.
export function IconButton({ icon, label, variant = 'ghost', onPress }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.base, variant === 'danger' ? styles.danger : styles.ghost, pressed && styles.pressed]}
    >
      <PixelIcon name={icon} size={ms(18)} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { width: ms(32), height: ms(32), alignItems: 'center', justifyContent: 'center', borderWidth: ms(2), borderColor: color.border },
  ghost: { backgroundColor: color.surfaceHighest, boxShadow: shadow.button.ghost },
  danger: { backgroundColor: color.errorContainer, boxShadow: shadow.button.ghost },
  pressed: { boxShadow: shadow.button.pressed, transform: [{ translateY: 2 }] },
});
