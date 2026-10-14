import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../theme';

export type ProgressVariant = 'primary' | 'secondary' | 'tertiary' | 'error';

export interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  label?: string;
  showValue?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TOTAL_BLOCKS = 16;

export function ProgressBar({ value, max = 100, variant = 'primary', label, showValue = false, style }: ProgressBarProps) {
  const pct = Math.min(Math.max(value / max, 0), 1);
  const filledBlocks = Math.round(pct * TOTAL_BLOCKS);

  return (
    <View style={style}>
      {(label || showValue) && (
        <View style={styles.header}>
          {label && <Text style={styles.caption}>{label}</Text>}
          {showValue && (
            <Text style={styles.caption}>
              {value}/{max}
            </Text>
          )}
        </View>
      )}
      <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max, now: value }}>
        {Array.from({ length: TOTAL_BLOCKS }, (_, i) => (
          <View key={i} style={[styles.block, i < filledBlocks ? blockStyles[variant] : styles.empty]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ms(space[1]) },
  caption: {
    fontFamily: font.mono,
    fontSize: ms(text.labelCaps.fontSize),
    lineHeight: ms(text.labelCaps.lineHeight),
    color: color.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  track: {
    flexDirection: 'row',
    height: ms(28),
    padding: ms(3),
    gap: ms(2),
    backgroundColor: color.surfaceLowest,
    borderWidth: ms(4),
    borderColor: color.border,
  },
  block: { flex: 1 },
  empty: { backgroundColor: color.surfaceHigh },
});

const blockStyles = StyleSheet.create({
  primary: { backgroundColor: color.primary },
  secondary: { backgroundColor: color.secondary },
  tertiary: { backgroundColor: color.tertiary },
  error: { backgroundColor: color.error },
});
