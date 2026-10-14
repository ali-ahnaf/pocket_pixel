import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { toPixelIcon } from '../../lib/iconMapper';
import { AVAILABLE_ICONS } from '../../lib/static';
import { color, font, shadow, space, text } from '../../theme';
import { PixelIcon } from '../PixelIcon';

// Two rows that scroll sideways, like the web grid-rows-2 grid-flow-col.
const COLUMNS: string[][] = [];
for (let i = 0; i < AVAILABLE_ICONS.length; i += 2) COLUMNS.push(AVAILABLE_ICONS.slice(i, i + 2));

export interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Icon</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.grid} keyboardShouldPersistTaps="handled">
        {COLUMNS.map((column) => (
          <View key={column[0]} style={styles.column}>
            {column.map((name) => {
              const isSelected = value === name;
              return (
                <Pressable
                  key={name}
                  accessibilityRole="button"
                  accessibilityLabel={`Icon ${name}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => onChange(name)}
                  style={[styles.cell, isSelected ? styles.selected : styles.idle]}
                >
                  <PixelIcon name={toPixelIcon(name)} size={ms(28)} />
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: ms(space[2]) },
  label: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(text.labelCaps.lineHeight), color: color.onSurfaceVariant, textTransform: 'uppercase' },
  grid: { gap: ms(space[3]), padding: ms(space[1]) },
  column: { gap: ms(space[3]) },
  cell: { width: ms(48), height: ms(48), alignItems: 'center', justifyContent: 'center', borderWidth: ms(4) },
  idle: { borderColor: color.border, backgroundColor: color.surfaceLowest, boxShadow: shadow.card },
  selected: { borderColor: color.primary, backgroundColor: color.primaryContainer, boxShadow: shadow.toggleActive, transform: [{ scale: 1.1 }] },
});
