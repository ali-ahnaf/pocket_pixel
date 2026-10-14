import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { ms } from 'react-native-size-matters';
import { BottomSheetModal } from '../BottomSheetModal';
import { color, font, space } from '../../theme';

export interface FilterButtonProps {
  label: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Sheet content, usually FilterOption rows. Gets close() so single-choice rows can dismiss the sheet. */
  children: (close: () => void) => ReactNode;
}

// Compact pixel trigger for the drop filters and sort field. The web popover opens as a bottom sheet here.
export function FilterButton({ label, accessibilityLabel, style, children }: FilterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ expanded: isOpen }}
        hitSlop={8}
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed, style]}
      >
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      {isOpen ? <BottomSheetModal onClose={() => setIsOpen(false)}>{(close) => <ScrollView style={styles.list}>{children(close)}</ScrollView>}</BottomSheetModal> : null}
    </>
  );
}

export function FilterOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.option, selected ? styles.optionSelected : pressed && styles.optionPressed]}
    >
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(space[1]),
    minHeight: ms(32),
    paddingHorizontal: ms(space[2]),
    backgroundColor: color.bg,
    borderWidth: ms(2),
    borderColor: color.border,
  },
  pressed: { transform: [{ translateY: 1 }] },
  label: { flexShrink: 1, fontFamily: font.mono, fontSize: ms(10), color: color.onSurface, textTransform: 'uppercase' },
  chevron: { fontSize: ms(12), color: color.onSurface },
  list: { maxHeight: ms(360), borderWidth: ms(2), borderColor: color.border },
  option: { minHeight: ms(44), justifyContent: 'center', paddingHorizontal: ms(space[3]), backgroundColor: color.bg, borderBottomWidth: 1, borderColor: color.border },
  optionPressed: { backgroundColor: color.surfaceHighest },
  optionSelected: { backgroundColor: color.primary },
  optionLabel: { fontFamily: font.mono, fontSize: ms(12), color: color.onSurface, textTransform: 'uppercase' },
  optionLabelSelected: { color: color.onPrimary },
});
