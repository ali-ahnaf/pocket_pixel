import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../theme';

export type BadgeVariant = 'primary' | 'secondary' | 'tertiary' | 'error' | 'outline';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, variant = 'outline', style }: BadgeProps) {
  return (
    <View style={[styles.badge, variantStyles[variant], style]}>
      <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: ms(2),
    borderColor: color.border,
    paddingHorizontal: ms(space[2]),
    paddingVertical: ms(space[1]),
  },
  label: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(text.labelCaps.lineHeight), textTransform: 'uppercase' },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: color.primary },
  secondary: { backgroundColor: color.secondaryContainer },
  tertiary: { backgroundColor: color.tertiaryContainer },
  error: { backgroundColor: color.errorContainer },
  outline: { backgroundColor: 'transparent', borderColor: color.outline },
});

const labelStyles = StyleSheet.create({
  primary: { color: color.onPrimary },
  secondary: { color: color.onSecondaryContainer },
  tertiary: { color: color.onTertiaryContainer },
  error: { color: color.onErrorContainer },
  outline: { color: color.onSurfaceVariant },
});
