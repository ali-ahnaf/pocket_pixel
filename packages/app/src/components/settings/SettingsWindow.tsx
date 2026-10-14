import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, shadow, space } from '../../theme';

export interface SettingsWindowProps {
  /** Emoji or unicode glyph before the title. */
  glyph: string;
  title: string;
  children: ReactNode;
}

// The elevated panel with a titled header bar used by the AI and Google OAuth settings pages.
export function SettingsWindow({ glyph, title, children }: SettingsWindowProps) {
  return (
    <View style={styles.window}>
      <View style={styles.header}>
        <Text style={styles.glyph}>{glyph}</Text>
        <Text accessibilityRole="header" style={settingsStyles.sectionTitle}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

/** Shared section layout and text styles for content inside a SettingsWindow. */
export const settingsStyles = StyleSheet.create({
  section: { paddingHorizontal: ms(space[6]), paddingVertical: ms(space[6]), gap: ms(space[4]) },
  dividerTop: { borderTopWidth: ms(4), borderColor: color.border },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]) },
  sectionTitle: { fontFamily: font.heading, fontSize: ms(18), lineHeight: ms(24), color: color.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  glyph: { fontSize: ms(18) },
  hint: { fontFamily: font.body, fontSize: ms(12), lineHeight: ms(16), color: color.onSurfaceVariant },
});

const styles = StyleSheet.create({
  window: { backgroundColor: color.surfaceHigh, borderWidth: ms(4), borderColor: color.border, boxShadow: shadow.window },
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
  glyph: { fontSize: ms(18) },
});
