import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, shadow, space, text } from '../../theme';
import { PixelIcon } from '../PixelIcon';

const MONTH_NAMES = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

export interface MonthSelectorProps {
  /** 0-based, like Date.getMonth(). */
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

// Month switcher from the top of packages/ui/src/app/page.tsx, with a "Current Month" shortcut when away from today.
export function MonthSelector({ month, year, onChange }: MonthSelectorProps) {
  const now = new Date();
  const isCurrent = month === now.getMonth() && year === now.getFullYear();
  const shift = (delta: number): void => {
    const d = new Date(year, month + delta, 1);
    onChange(d.getMonth(), d.getFullYear());
  };

  return (
    <View style={styles.bar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous month" hitSlop={4} onPress={() => shift(-1)} style={({ pressed }) => [styles.nav, pressed && styles.pressed]}>
        <PixelIcon name="ChevronLeft" size={ms(20)} />
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.title} accessibilityRole="header">
          {MONTH_NAMES[month]} {year}
        </Text>
        {!isCurrent && (
          <Pressable accessibilityRole="button" hitSlop={10} onPress={() => onChange(now.getMonth(), now.getFullYear())} style={({ pressed }) => [styles.current, pressed && styles.pressed]}>
            <Text style={styles.currentLabel}>Current Month</Text>
          </Pressable>
        )}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Next month" hitSlop={4} onPress={() => shift(1)} style={({ pressed }) => [styles.nav, pressed && styles.pressed]}>
        <PixelIcon name="ChevronRight" size={ms(20)} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.surface,
    borderWidth: ms(4),
    borderColor: color.border,
    padding: ms(space[4]),
    boxShadow: shadow.card,
  },
  nav: { width: ms(44), height: ms(44), alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg, borderWidth: ms(4), borderColor: color.outline },
  pressed: { transform: [{ translateY: 2 }] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: ms(60) },
  title: { fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), lineHeight: ms(text.headlineMd.lineHeight), color: color.primary, textAlign: 'center' },
  current: { marginTop: ms(space[1]), borderWidth: ms(2), borderColor: color.primary, backgroundColor: color.bg, paddingHorizontal: ms(space[2]), height: ms(24), justifyContent: 'center' },
  currentLabel: { fontFamily: font.mono, fontSize: ms(10), color: color.primary, textTransform: 'uppercase' },
});
