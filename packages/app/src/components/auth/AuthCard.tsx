import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, shadow, space } from '../../theme';
import { PixelIcon, PixelIconName } from '../PixelIcon';

export type AuthCardTone = 'primary' | 'secondary';

export interface AuthCardProps {
  title: string;
  /** Sprite shown before the title. */
  icon: PixelIconName;
  tone?: AuthCardTone;
  /** Tag in the faded footer decor (e.g. AUTH_V1). Omit to hide the footer. */
  footerTag?: string;
  children: ReactNode;
}

// Bordered pixel card with a header bar, ported from the card markup repeated in the web auth pages.
export function AuthCard({ title, icon, tone = 'primary', footerTag, children }: AuthCardProps) {
  const toneStyle = tone === 'primary' ? styles.primary : styles.secondary;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <PixelIcon name={icon} size={ms(24)} />
        <Text style={[styles.title, toneStyle]} accessibilityRole="header">
          {title}
        </Text>
      </View>
      <View style={styles.body}>{children}</View>
      {footerTag && (
        <View style={styles.footer}>
          <View style={styles.squares}>
            <View style={[styles.square, styles.squarePrimary]} />
            <View style={[styles.square, styles.squareSecondary]} />
            <View style={[styles.square, styles.squareTertiary]} />
          </View>
          <Text style={styles.footerTag}>{footerTag}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surfaceHigh, borderWidth: ms(4), borderColor: color.border, boxShadow: shadow.window },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(space[2]),
    paddingHorizontal: ms(space[6]),
    paddingVertical: ms(space[4]),
    borderBottomWidth: ms(4),
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  title: { fontFamily: font.heading, fontSize: ms(18), textTransform: 'uppercase', letterSpacing: 0.8 },
  primary: { color: color.primary },
  secondary: { color: color.secondary },
  body: { paddingHorizontal: ms(space[6]), paddingVertical: ms(space[6]), gap: ms(space[5]) },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: ms(space[6]), paddingBottom: ms(space[4]), opacity: 0.3 },
  squares: { flexDirection: 'row', gap: ms(space[1]) },
  square: { width: ms(10), height: ms(10), borderWidth: ms(2), borderColor: color.border },
  squarePrimary: { backgroundColor: color.primary },
  squareSecondary: { backgroundColor: color.secondary },
  squareTertiary: { backgroundColor: color.tertiary },
  footerTag: { fontFamily: font.mono, fontSize: ms(9), color: color.onSurface, letterSpacing: 2 },
});
