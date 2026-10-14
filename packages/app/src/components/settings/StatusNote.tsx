import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';

export type StatusNoteTone = 'success' | 'muted' | 'error';

export interface StatusNoteProps {
  label: string;
  tone?: StatusNoteTone;
  /** Optional leading glyph, e.g. '✔'. */
  glyph?: string;
}

// The bordered mono status line the web settings pages repeat ("Key saved", "Not watching", errors).
export function StatusNote({ label, tone = 'muted', glyph }: StatusNoteProps) {
  return (
    <View style={styles.box}>
      <Text style={[styles.text, toneStyles[tone]]}>
        {glyph ? `${glyph} ` : ''}
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: ms(4), borderColor: color.border, backgroundColor: color.surface, padding: ms(space[3]) },
  text: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(16), textTransform: 'uppercase' },
});

const toneStyles = StyleSheet.create({
  success: { color: color.primary },
  muted: { color: color.onSurfaceVariant },
  error: { color: color.error },
});
