import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { BottomSheetModal } from '../BottomSheetModal';
import { color, font, shadow, space, text } from '../../theme';
import { ALL_TIME_PERIOD, MONTH_NAMES } from './useStats';
import { PixelIcon } from '../PixelIcon';

export const displayMonthYear = (yyyyMm: string): string => {
  if (yyyyMm === ALL_TIME_PERIOD) return 'ALL TIME';
  const [y, m] = yyyyMm.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

export interface PeriodPickerProps {
  /** YYYY-MM, or ALL_TIME_PERIOD. */
  value: string;
  onChange: (value: string) => void;
}

// Ported from the stats page month/year popover: an ALL TIME option, a year switcher and a month grid, in a bottom sheet.
export function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const isAllTime = value === ALL_TIME_PERIOD;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Period: ${displayMonthYear(value)}`}
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <PixelIcon name="Calendar" size={ms(20)} />
        <Text style={styles.triggerText} numberOfLines={1}>
          {displayMonthYear(value)}
        </Text>
        <PixelIcon name="ChevronDown" size={ms(16)} />
      </Pressable>

      {isOpen ? (
        <BottomSheetModal onClose={() => setIsOpen(false)}>
          {(close) => {
            const pick = (next: string): void => {
              onChange(next);
              close();
            };
            return (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isAllTime }}
                  onPress={() => pick(ALL_TIME_PERIOD)}
                  style={[styles.cell, styles.allTime, isAllTime && styles.cellActive]}
                >
                  <Text style={[styles.allTimeText, isAllTime && styles.cellTextActive]}>ALL TIME</Text>
                </Pressable>

                <View style={styles.yearRow}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Previous year" hitSlop={12} onPress={() => setPickerYear((y) => y - 1)} style={styles.yearButton}>
                    <PixelIcon name="ChevronLeft" size={ms(20)} />
                  </Pressable>
                  <Text style={styles.year}>{pickerYear}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel="Next year" hitSlop={12} onPress={() => setPickerYear((y) => y + 1)} style={styles.yearButton}>
                    <PixelIcon name="ChevronRight" size={ms(20)} />
                  </Pressable>
                </View>

                <View style={styles.grid}>
                  {MONTH_NAMES.map((mon, i) => {
                    const monthValue = `${pickerYear}-${String(i + 1).padStart(2, '0')}`;
                    const isActive = value === monthValue;
                    return (
                      <Pressable
                        key={mon}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                        onPress={() => pick(monthValue)}
                        style={[styles.cell, styles.month, isActive && styles.cellActive]}
                      >
                        <Text style={[styles.cellText, isActive && styles.cellTextActive]}>{mon}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            );
          }}
        </BottomSheetModal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: ms(48),
    paddingHorizontal: ms(space[3]),
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(space[2]),
    backgroundColor: color.surface,
    borderWidth: ms(4),
    borderColor: color.border,
    boxShadow: shadow.card,
  },
  pressed: { backgroundColor: color.surfaceHighest, transform: [{ translateY: 2 }] },
  triggerText: { flex: 1, fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurface },
  cell: { minHeight: ms(44), alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: color.border, backgroundColor: color.surface },
  cellActive: { backgroundColor: color.primary, boxShadow: shadow.card },
  allTime: { padding: ms(space[2]) },
  allTimeText: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.onSurface, textTransform: 'uppercase' },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: color.surfaceLow, borderWidth: 2, borderColor: color.border, padding: ms(space[1]) },
  yearButton: { width: ms(36), height: ms(36), alignItems: 'center', justifyContent: 'center' },
  year: { fontFamily: font.heading, fontSize: ms(18), color: color.onSurface },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(space[2]) },
  month: { width: '31%' },
  cellText: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), color: color.onSurface },
  cellTextActive: { color: color.onPrimary },
});
