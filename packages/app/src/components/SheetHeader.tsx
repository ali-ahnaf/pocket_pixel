import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../theme';
import { PixelIcon, PixelIconName } from './PixelIcon';

export interface SheetHeaderProps {
  title: string;
  icon?: PixelIconName;
  danger?: boolean;
  /** Pass the `close` from BottomSheetModal's children so the sheet animates out. */
  onClose: () => void;
}

// Title row with the square close button that the web modals share.
export function SheetHeader({ title, icon, danger = false, onClose }: SheetHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titleRow}>
        {icon ? <PixelIcon name={icon} size={ms(24)} /> : null}
        <Text style={[styles.title, danger && styles.danger]} accessibilityRole="header">
          {title}
        </Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={4} onPress={onClose} style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
        <PixelIcon name="X" size={ms(24)} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ms(space[3]), paddingBottom: ms(space[3]) },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: ms(space[2]) },
  title: { flexShrink: 1, fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), lineHeight: ms(text.headlineMd.lineHeight), color: color.primary, textTransform: 'uppercase' },
  danger: { color: color.error },
  close: { width: ms(44), height: ms(44), alignItems: 'center', justifyContent: 'center', backgroundColor: color.surfaceHighest, borderWidth: ms(4), borderColor: color.border },
  pressed: { backgroundColor: color.errorContainer, transform: [{ translateY: 2 }] },
});
