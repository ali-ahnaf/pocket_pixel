import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { Button } from '../Button';
import { PixelIcon, PixelIconName } from '../PixelIcon';

export interface SectionHeaderProps {
  icon: PixelIconName;
  title: string;
  tone?: 'primary' | 'secondary' | 'tertiary';
  open: boolean;
  onToggle: () => void;
  /** Shows the Add button and the underline, like the web Vaults/Quests/Tags headers. */
  onAdd?: () => void;
}

// Collapsible section title of the profile page.
export function SectionHeader({ icon, title, tone = 'primary', open, onToggle, onAdd }: SectionHeaderProps) {
  return (
    <View style={[styles.row, onAdd && styles.underlined]}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={styles.toggle}>
        <PixelIcon name={icon} size={ms(24)} />
        <Text style={[styles.title, toneStyles[tone]]} accessibilityRole="header">
          {title}
        </Text>
        <View style={open && styles.chevronOpen}>
          <PixelIcon name="ChevronDown" size={ms(20)} />
        </View>
      </Pressable>
      {onAdd && <Button label="Add" icon="Plus" size="sm" onPress={onAdd} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ms(space[3]), paddingBottom: ms(space[2]) },
  underlined: { borderBottomWidth: ms(4), borderColor: color.outlineVariant },
  toggle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: ms(space[2]), minHeight: ms(44) },
  title: { flexShrink: 1, fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), lineHeight: ms(text.headlineMd.lineHeight) },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
});

const toneStyles = StyleSheet.create({
  primary: { color: color.primary },
  secondary: { color: color.secondary },
  tertiary: { color: color.tertiary },
});
