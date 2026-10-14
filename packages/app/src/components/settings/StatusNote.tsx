import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { PixelIcon, PixelIconName } from '../PixelIcon';

export type StatusNoteTone = 'success' | 'muted' | 'error';

export interface StatusNoteProps {
  label: string;
  tone?: StatusNoteTone;
  /** Optional leading sprite, e.g. 'Check'. */
  icon?: PixelIconName;
}

// The bordered mono status line the web settings pages repeat ("Key saved", "Not watching", errors).
export function StatusNote({ label, tone = 'muted', icon }: StatusNoteProps) {
  return (
    <View style={styles.box}>
      {icon ? <PixelIcon name={icon} size={ms(16)} /> : null}
      <Text style={[styles.text, toneStyles[tone]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]), borderWidth: ms(4), borderColor: color.border, backgroundColor: color.surface, padding: ms(space[3]) },
  text: { flexShrink: 1, fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(16), textTransform: 'uppercase' },
});

const toneStyles = StyleSheet.create({
  success: { color: color.primary },
  muted: { color: color.onSurfaceVariant },
  error: { color: color.error },
});
