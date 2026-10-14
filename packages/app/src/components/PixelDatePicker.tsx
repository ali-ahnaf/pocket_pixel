import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { toIsoDate } from '../lib/formatters';
import { color, font, shadow, space, text } from '../theme';
import { BottomSheetModal } from './BottomSheetModal';
import { PixelIcon } from './PixelIcon';

export interface PixelDatePickerProps {
  /** YYYY-MM-DD, or '' for no date. */
  value: string;
  onChange: (value: string) => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const parseDate = (value: string): Date | null => {
  const [year, month, day] = value.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
};

const buildCalendarDays = (viewDate: Date): Date[] => {
  const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  start.setDate(1 - start.getDay());
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
};

// Ported from packages/ui/src/components/PixelDatePicker.tsx. The web popover opens as a bottom sheet here.
export function PixelDatePicker({ value, onChange }: PixelDatePickerProps) {
  const selected = parseDate(value);
  const todayIso = toIsoDate(new Date());
  const [viewDate, setViewDate] = useState<Date | null>(null);

  const days = viewDate ? buildCalendarDays(viewDate) : [];

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Change date" onPress={() => setViewDate(selected ?? new Date())} style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}>
        <PixelIcon name="Calendar" size={ms(24)} />
      </Pressable>

      {viewDate ? (
        <BottomSheetModal onClose={() => setViewDate(null)}>
          {(close) => {
            const pick = (iso: string): void => {
              onChange(iso);
              close();
            };
            return (
              <>
                <View style={styles.header}>
                  <Text style={styles.month}>{viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
                  <View style={styles.navRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Previous month"
                      hitSlop={6}
                      onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                      style={styles.navButton}
                    >
                      <PixelIcon name="ChevronLeft" size={ms(20)} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Next month"
                      hitSlop={6}
                      onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                      style={styles.navButton}
                    >
                      <PixelIcon name="ChevronRight" size={ms(20)} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.grid}>
                  {WEEKDAYS.map((weekday, i) => (
                    <Text key={i} style={[styles.cell, styles.weekday]}>
                      {weekday}
                    </Text>
                  ))}
                  {days.map((day) => {
                    const iso = toIsoDate(day);
                    const isSelected = iso === value && selected !== null;
                    const isToday = iso === todayIso;
                    const isCurrentMonth = day.getMonth() === viewDate.getMonth();
                    return (
                      <Pressable
                        key={iso}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => pick(iso)}
                        style={[styles.cell, styles.day, isSelected ? styles.daySelected : isToday && styles.dayToday]}
                      >
                        <Text style={[styles.dayText, !isCurrentMonth && styles.dayOutside, isToday && styles.dayTodayText, isSelected && styles.daySelectedText]}>{day.getDate()}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.footer}>
                  <Pressable accessibilityRole="button" hitSlop={8} onPress={() => pick(todayIso)}>
                    <Text style={[styles.footerText, styles.today]}>Today</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" hitSlop={8} onPress={() => pick('')}>
                    <Text style={styles.footerText}>Clear</Text>
                  </Pressable>
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
    width: ms(64),
    height: ms(64),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surfaceLowest,
    borderWidth: ms(4),
    borderColor: color.border,
    boxShadow: shadow.input,
  },
  pressed: { transform: [{ translateY: 2 }] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { fontFamily: font.heading, fontSize: ms(18), color: color.primary, textTransform: 'uppercase' },
  navRow: { flexDirection: 'row', gap: ms(space[1]) },
  navButton: { width: ms(36), height: ms(36), alignItems: 'center', justifyContent: 'center', backgroundColor: color.surfaceLowest, borderWidth: ms(2), borderColor: color.border },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: ms(40), alignItems: 'center', justifyContent: 'center' },
  weekday: { fontFamily: font.mono, fontSize: ms(10), lineHeight: ms(40), textAlign: 'center', color: color.outline },
  day: { borderWidth: ms(2), borderColor: 'transparent' },
  daySelected: { backgroundColor: color.primary, borderColor: color.border },
  dayToday: { borderColor: color.primary },
  dayText: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), color: color.onSurface },
  dayOutside: { color: color.outlineVariant },
  dayTodayText: { color: color.primary },
  daySelectedText: { fontFamily: font.bodyBold, color: color.onPrimary },
  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: ms(space[3]), borderTopWidth: ms(2), borderColor: color.outlineVariant },
  footerText: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.outline, textTransform: 'uppercase' },
  today: { color: color.primary },
});
