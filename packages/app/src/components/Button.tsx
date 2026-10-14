import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, shadow, space } from '../theme';
import { PixelIcon, PixelIconName } from './PixelIcon';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  /** Sprite shown before the label. */
  icon?: PixelIconName;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, icon, onPress, variant = 'primary', size = 'md', disabled = false, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        { boxShadow: pressed ? shadow.button.pressed : shadow.button[variant] },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? <PixelIcon name={icon} size={ms(iconSizes[size])} /> : null}
      <Text style={[styles.label, labelSizeStyles[size], labelVariantStyles[variant]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', gap: ms(space[2]), alignItems: 'center', justifyContent: 'center', borderWidth: ms(4), borderColor: color.border },
  pressed: { transform: [{ translateY: 2 }] },
  disabled: { opacity: 0.4 },
  label: { fontFamily: font.heading, textTransform: 'uppercase', letterSpacing: 0.8 },
});

const iconSizes: Record<ButtonSize, number> = { sm: 14, md: 18, lg: 22 };

const sizeStyles = StyleSheet.create({
  sm: { paddingHorizontal: ms(space[3]), paddingVertical: ms(space[1]) },
  md: { paddingHorizontal: ms(space[4]), paddingVertical: ms(space[2]) },
  lg: { paddingHorizontal: ms(space[6]), paddingVertical: ms(space[3]) },
});

const labelSizeStyles = StyleSheet.create({
  sm: { fontSize: ms(12), lineHeight: ms(16) },
  md: { fontSize: ms(14), lineHeight: ms(20) },
  lg: { fontSize: ms(16), lineHeight: ms(24) },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: color.primary },
  secondary: { backgroundColor: color.secondaryContainer },
  tertiary: { backgroundColor: color.tertiaryContainer },
  ghost: { backgroundColor: 'transparent', borderColor: color.outline },
  danger: { backgroundColor: color.errorContainer },
});

const labelVariantStyles = StyleSheet.create({
  primary: { color: color.onPrimary },
  secondary: { color: color.onSecondaryContainer },
  tertiary: { color: color.onTertiaryContainer },
  ghost: { color: color.onSurface },
  danger: { color: color.onErrorContainer },
});
