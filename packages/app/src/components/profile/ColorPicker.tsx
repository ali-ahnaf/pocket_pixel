import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { AVAILABLE_COLORS } from '../../lib/static';
import { color, font, space, text } from '../../theme';
import { Input } from '../Input';

// '#3b82f6', the web default for new vaults and tags.
export const DEFAULT_COLOR = AVAILABLE_COLORS[8];

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** A user-typed or stored color, or the default when it is not a valid hex (RN warns on invalid colors). */
export const safeColor = (value: string | null | undefined): string => (value && HEX.test(value) ? value : DEFAULT_COLOR);

export interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

// Web has a native <input type="color">; here the hex field plus the preset swatches cover it.
export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Color</Text>
      <View style={styles.row}>
        <View style={[styles.preview, { backgroundColor: safeColor(value) }]} />
        <View style={styles.field}>
          <Input value={value} onChangeText={onChange} placeholder="#000000" autoCapitalize="none" autoCorrect={false} accessibilityLabel="Hex color" style={styles.hex} />
        </View>
      </View>
      <View style={styles.swatches}>
        {AVAILABLE_COLORS.map((c) => (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`Color ${c}`}
            accessibilityState={{ selected: value === c }}
            hitSlop={6}
            onPress={() => onChange(c)}
            style={[styles.swatch, { backgroundColor: c }, value === c && styles.swatchSelected]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: ms(space[2]) },
  label: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(text.labelCaps.lineHeight), color: color.onSurfaceVariant, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', gap: ms(space[3]) },
  preview: { width: ms(48), height: ms(48), borderWidth: ms(4), borderColor: color.border },
  field: { flex: 1 },
  hex: { fontFamily: font.mono, textTransform: 'uppercase' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(space[2]) },
  swatch: { width: ms(32), height: ms(32), borderWidth: ms(2), borderColor: color.border },
  swatchSelected: { borderColor: color.primary, borderWidth: ms(3), transform: [{ scale: 1.1 }] },
});
