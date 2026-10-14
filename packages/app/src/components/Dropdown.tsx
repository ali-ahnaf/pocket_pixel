import { ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, space } from '../theme';
import { BottomSheetModal } from './BottomSheetModal';

export interface DropdownProps<T> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  renderValue: (value: T) => ReactNode;
  renderOption: (option: T, isSelected: boolean) => ReactNode;
  keyExtractor: (option: T) => string | number;
  accessibilityLabel?: string;
}

// The web version anchors a popover under the trigger. On native the options open in a bottom sheet instead, which avoids measuring the trigger.
export function Dropdown<T>({ options, value, onChange, renderValue, renderOption, keyExtractor, accessibilityLabel }: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedKey = keyExtractor(value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
      >
        <View style={styles.row}>{renderValue(value)}</View>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      {isOpen ? (
        <BottomSheetModal onClose={() => setIsOpen(false)}>
          {(close) => (
            <ScrollView style={styles.list}>
              {options.map((option) => {
                const optionKey = keyExtractor(option);
                const isSelected = optionKey === selectedKey;
                return (
                  <Pressable
                    key={optionKey}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      onChange(option);
                      close();
                    }}
                    style={({ pressed }) => [styles.option, (isSelected || pressed) && styles.optionActive]}
                  >
                    {renderOption(option, isSelected)}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </BottomSheetModal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    height: ms(56),
    paddingHorizontal: ms(space[4]),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.surfaceLowest,
    borderWidth: ms(4),
    borderColor: color.border,
  },
  triggerPressed: { backgroundColor: color.surfaceLow, transform: [{ translateY: 2 }] },
  row: { flexDirection: 'row', alignItems: 'center', gap: ms(space[3]) },
  chevron: { fontSize: ms(20), color: color.outline },
  list: { maxHeight: ms(360), borderWidth: ms(4), borderColor: color.border },
  option: {
    height: ms(56),
    paddingHorizontal: ms(space[4]),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.surfaceLow,
  },
  optionActive: { backgroundColor: color.surfaceHighest },
});
