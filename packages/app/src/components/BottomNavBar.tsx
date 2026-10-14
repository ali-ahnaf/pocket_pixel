import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { color, font, shadow, space } from '../theme';

const ITEMS: Record<string, { label: string; glyph: string }> = {
  index: { label: 'HOME', glyph: '⌂' },
  stats: { label: 'STATS', glyph: '▥' },
  debts: { label: 'DEBTS', glyph: '⛁' },
  profile: { label: 'PROFILE', glyph: '☺' },
};

// Tab bar for the (tabs) layout, ported from packages/ui/src/components/BottomNavBar.tsx.
export function BottomNavBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const item = ITEMS[route.name];
        if (!item) return null;
        const isActive = state.index === index;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              if (!isActive) navigation.navigate(route.name);
            }}
            style={({ pressed }) => [styles.item, isActive && styles.active, pressed && !isActive && styles.pressed]}
          >
            <Text style={[styles.glyph, isActive ? styles.activeText : styles.inactiveText]}>{item.glyph}</Text>
            <Text style={[styles.label, isActive ? styles.activeText : styles.inactiveText]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: ms(space[2]),
    paddingHorizontal: ms(space[2]),
    backgroundColor: color.surfaceLow,
    borderTopWidth: ms(4),
    borderColor: color.border,
  },
  item: { width: ms(64), height: ms(64), alignItems: 'center', justifyContent: 'center', borderWidth: ms(4), borderColor: 'transparent', marginBottom: ms(space[2]) },
  active: { backgroundColor: color.primary, borderColor: color.border, transform: [{ translateY: -2 }], boxShadow: shadow.toggleActive },
  pressed: { backgroundColor: color.surfaceHighest, transform: [{ translateY: 2 }] },
  glyph: { fontSize: ms(22), lineHeight: ms(26) },
  label: { fontFamily: font.mono, fontSize: ms(10), marginTop: ms(space[1]) },
  activeText: { color: color.onPrimary },
  inactiveText: { color: color.outline },
});
