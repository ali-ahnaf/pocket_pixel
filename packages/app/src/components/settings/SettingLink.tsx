import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color } from '../../theme';
import { PixelIcon, PixelIconName } from '../PixelIcon';
import { settingRowStyles } from './SettingToggle';

export interface SettingLinkProps {
  label: string;
  description: string;
  /** Sprite shown in the icon box. */
  icon: PixelIconName;
  onPress: () => void;
}

// Covers both the web's in-app <Link> rows and its external <a> rows; the caller decides where onPress goes.
export function SettingLink({ label, description, icon, onPress }: SettingLinkProps) {
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={label} accessibilityHint={description} onPress={onPress} style={({ pressed }) => [settingRowStyles.row, pressed && styles.pressed]}>
      {({ pressed }) => (
        <>
          <View style={settingRowStyles.info}>
            <View style={settingRowStyles.iconBox}>
              <PixelIcon name={icon} size={ms(24)} />
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
          <PixelIcon name="ChevronRight" size={ms(24)} />
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { backgroundColor: color.primary, transform: [{ translateY: 2 }] },
  pressedText: { color: color.onPrimary },
});
