import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, shadow, space, text } from '../../theme';

export interface SettingToggleProps {
  label: string;
  description: string;
  /** Emoji or unicode glyph shown in the icon box. */
  glyph: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

// Pixel switch ported from the web settings page instead of the native Switch, to keep the web look.
export function SettingToggle({ label, description, glyph, checked, onChange }: SettingToggleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <View style={styles.iconBox}>
          <Text style={styles.glyph}>{glyph}</Text>
        </View>
        <View style={styles.texts}>
          <Text numberOfLines={1} style={styles.label}>
            {label}
          </Text>
          <Text numberOfLines={2} style={styles.description}>
            {description}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
        hitSlop={8}
        onPress={() => onChange(!checked)}
        style={({ pressed }) => [styles.track, checked ? styles.trackOn : styles.trackOff, pressed && styles.pressed]}
      >
        <View style={[styles.thumb, checked ? styles.thumbOn : styles.thumbOff]} />
      </Pressable>
    </View>
  );
}

export const settingRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(space[4]),
    backgroundColor: color.bg,
    padding: ms(space[4]),
    borderWidth: ms(4),
    borderColor: color.border,
    boxShadow: shadow.card,
  },
  info: { flexDirection: 'row', alignItems: 'center', gap: ms(space[3]), flex: 1, minWidth: 0 },
  iconBox: {
    width: ms(40),
    height: ms(40),
    borderWidth: ms(2),
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.secondaryContainer,
  },
  glyph: { fontSize: ms(18) },
  texts: { flex: 1, minWidth: 0 },
  label: { fontFamily: font.bodyBold, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurface },
  description: { fontFamily: font.body, fontSize: ms(12), lineHeight: ms(16), color: color.onSurfaceVariant },
});

const styles = StyleSheet.create({
  ...settingRowStyles,
  track: { width: ms(64), height: ms(32), borderWidth: ms(4), borderColor: color.border, justifyContent: 'center' },
  trackOn: { backgroundColor: color.primary },
  trackOff: { backgroundColor: color.surfaceHighest },
  pressed: { transform: [{ translateY: 2 }] },
  thumb: { width: ms(20), height: ms(20), backgroundColor: color.bg, borderWidth: ms(2), borderColor: color.border },
  thumbOn: { alignSelf: 'flex-end', marginRight: ms(2) },
  thumbOff: { alignSelf: 'flex-start', marginLeft: ms(2) },
});
