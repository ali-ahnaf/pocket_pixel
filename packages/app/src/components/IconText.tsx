import { ReactNode } from 'react';
import { AccessibilityRole, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { ms } from 'react-native-size-matters';
import { space } from '../theme';
import { PixelIcon, PixelIconName } from './PixelIcon';

export interface IconTextProps {
  icon: PixelIconName;
  children: ReactNode;
  /** Style of the text. The sprite keeps its own colors. */
  style?: StyleProp<TextStyle>;
  /** Layout of the row, e.g. to align it or add margin. */
  rowStyle?: StyleProp<ViewStyle>;
  iconSize?: number;
  numberOfLines?: number;
  accessibilityRole?: AccessibilityRole;
}

// A sprite followed by text on one line. Stands in for the emoji-prefixed Text the web app uses.
export function IconText({ icon, children, style, rowStyle, iconSize = 16, numberOfLines, accessibilityRole }: IconTextProps) {
  return (
    <View style={[styles.row, rowStyle]}>
      <PixelIcon name={icon} size={ms(iconSize)} />
      <Text style={[styles.text, style]} numberOfLines={numberOfLines} accessibilityRole={accessibilityRole}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: ms(space[1]) },
  text: { flexShrink: 1 },
});
