import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, shadow, space, text } from '../theme';

export interface CardProps {
  elevated?: boolean;
  title?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ elevated = false, title, children, style }: CardProps) {
  return (
    <View style={[styles.card, elevated && styles.elevated, style]}>
      {title && (
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}

export interface WindowProps {
  title: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Window({ title, children, style }: WindowProps) {
  return (
    <View style={[styles.window, style]}>
      <Text style={styles.windowHeader} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.windowBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surfaceHigh,
    borderWidth: ms(4),
    borderColor: color.border,
    padding: ms(space[5]),
    boxShadow: shadow.card,
  },
  elevated: { borderColor: color.secondaryContainer, boxShadow: shadow.cardElevated },
  title: {
    fontFamily: font.heading,
    fontSize: ms(text.labelCaps.fontSize),
    lineHeight: ms(16),
    color: color.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: ms(space[3]),
  },
  window: { backgroundColor: color.surface, borderWidth: ms(4), borderColor: color.border, boxShadow: shadow.window },
  windowHeader: {
    backgroundColor: color.surfaceHigh,
    borderBottomWidth: ms(4),
    borderColor: color.border,
    paddingHorizontal: ms(space[4]),
    paddingVertical: ms(space[2]),
    fontFamily: font.heading,
    fontSize: ms(text.bodyLg.fontSize),
    color: color.onSurface,
  },
  windowBody: { padding: ms(space[5]) },
});
