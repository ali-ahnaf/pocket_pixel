import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { Card } from '../Card';
import { PixelIcon } from '../PixelIcon';

// Port of packages/ui/src/components/GmailReconnectBanner.tsx. Not dismissible: PendingExpensesPanel renders it only while Gmail needs reconnecting.
export function GmailReconnectBanner() {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <PixelIcon name="TriangleAlert" size={ms(20)} />
        <Text style={styles.title} accessibilityRole="header">
          Gmail Disconnected
        </Text>
      </View>
      <Text style={styles.body}>Google expired the connection. Reconnect to resume importing bank alerts.</Text>
      <Pressable accessibilityRole="link" onPress={() => router.push('/settings/google-oauth')} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
        <Text style={styles.linkLabel}>Reconnect</Text>
        <PixelIcon name="ChevronRight" size={ms(20)} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: ms(space[4]), gap: ms(space[3]), backgroundColor: color.surface, borderColor: color.error },
  header: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]), borderBottomWidth: ms(4), borderColor: color.border, paddingBottom: ms(space[2]) },
  title: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.error, textTransform: 'uppercase' },
  body: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurface },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: ms(44),
    padding: ms(space[3]),
    backgroundColor: color.bg,
    borderWidth: ms(4),
    borderStyle: 'dashed',
    borderColor: color.error,
  },
  pressed: { transform: [{ translateY: 2 }] },
  linkLabel: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.onSurface, textTransform: 'uppercase' },
});
