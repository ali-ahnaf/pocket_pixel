// STUB: Gmail OAuth connection status (always connected, so the banner stays hidden). No local data layer for this in packages/app yet, so it uses hardcoded stub data.
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { Card } from '../Card';

const RECONNECT_REQUIRED: boolean = false;

// Port of packages/ui/src/components/GmailReconnectBanner.tsx. Not dismissible: shown only while Gmail needs reconnecting.
export function GmailReconnectBanner() {
  if (!RECONNECT_REQUIRED) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.glyph}>⚠</Text>
        <Text style={styles.title} accessibilityRole="header">
          Gmail Disconnected
        </Text>
      </View>
      <Text style={styles.body}>Google expired the connection. Reconnect to resume importing bank alerts.</Text>
      <Pressable accessibilityRole="link" onPress={() => router.push('/settings/google-oauth')} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
        <Text style={styles.linkLabel}>Reconnect</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: ms(space[4]), gap: ms(space[3]), backgroundColor: color.surface, borderColor: color.error },
  header: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]), borderBottomWidth: ms(4), borderColor: color.border, paddingBottom: ms(space[2]) },
  glyph: { fontSize: ms(16), color: color.error },
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
  chevron: { fontSize: ms(18), color: color.error },
});
