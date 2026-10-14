import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font } from '../../theme';
import { settingRowStyles } from './SettingToggle';

export interface SettingLinkProps {
  label: string;
  description: string;
  /** Emoji or unicode glyph shown in the icon box. */
  glyph: string;
  onPress: () => void;
}

// Covers both the web's in-app <Link> rows and its external <a> rows; the caller decides where onPress goes.
export function SettingLink({ label, description, glyph, onPress }: SettingLinkProps) {
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={label} accessibilityHint={description} onPress={onPress} style={({ pressed }) => [settingRowStyles.row, pressed && styles.pressed]}>
      {({ pressed }) => (
        <>
          <View style={settingRowStyles.info}>
            <View style={settingRowStyles.iconBox}>
              <Text style={settingRowStyles.glyph}>{glyph}</Text>
            </View>
            <View style={settingRowStyles.texts}>
              <Text numberOfLines={1} style={[settingRowStyles.label, pressed && styles.pressedText]}>
                {label}
              </Text>
              <Text numberOfLines={2} style={[settingRowStyles.description, pressed && styles.pressedText]}>
                {description}
              </Text>
            </View>
          </View>
          <Text style={[styles.chevron, pressed && styles.pressedText]}>›</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { backgroundColor: color.primary, transform: [{ translateY: 2 }] },
  pressedText: { color: color.onPrimary },
  chevron: { fontFamily: font.heading, fontSize: ms(24), color: color.onSurface },
});
