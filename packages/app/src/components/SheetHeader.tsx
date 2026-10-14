import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../theme';

export interface SheetHeaderProps {
  title: string;
  glyph?: string;
  danger?: boolean;
  /** Pass the `close` from BottomSheetModal's children so the sheet animates out. */
  onClose: () => void;
}

// Title row with the square close button that the web modals share.
export function SheetHeader({ title, glyph, danger = false, onClose }: SheetHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={[styles.title, danger && styles.danger]} accessibilityRole="header">
        {glyph ? `${glyph} ${title}` : title}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={4} onPress={onClose} style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
        <Text style={styles.closeGlyph}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ms(space[3]), paddingBottom: ms(space[3]) },
  title: { flex: 1, fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), lineHeight: ms(text.headlineMd.lineHeight), color: color.primary, textTransform: 'uppercase' },
  danger: { color: color.error },
  close: { width: ms(44), height: ms(44), alignItems: 'center', justifyContent: 'center', backgroundColor: color.surfaceHighest, borderWidth: ms(4), borderColor: color.border },
  pressed: { backgroundColor: color.errorContainer, transform: [{ translateY: 2 }] },
  closeGlyph: { fontFamily: font.bodyBold, fontSize: ms(18), color: color.onSurface },
});
