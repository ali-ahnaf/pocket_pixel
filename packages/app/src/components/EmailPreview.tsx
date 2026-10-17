import type { PendingExpenseEmailDto } from '@expense-tracker/shared';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space } from '../theme';

export interface EmailPreviewProps {
  email: PendingExpenseEmailDto;
}

/** From, subject and a scrollable plain-text body of a fetched Gmail message. */
export function EmailPreview({ email }: EmailPreviewProps) {
  return (
    <View style={styles.email}>
      <View style={styles.metaRow}>
        <Text style={styles.metaKey}>From</Text>
        <Text style={styles.metaValue} numberOfLines={1}>
          {email.from}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaKey}>Subject</Text>
        <Text style={styles.metaValue} numberOfLines={1}>
          {email.subject}
        </Text>
      </View>
      <ScrollView style={styles.bodyScroll}>
        <Text style={styles.body} selectable>
          {email.bodyText}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  email: { borderWidth: ms(4), borderColor: color.border, backgroundColor: color.surfaceLowest, padding: ms(space[3]), gap: ms(space[1]) },
  metaRow: { flexDirection: 'row', gap: ms(space[3]) },
  metaKey: { width: ms(56), fontFamily: font.body, fontSize: ms(12), color: color.onSurfaceVariant },
  metaValue: { flex: 1, fontFamily: font.body, fontSize: ms(12), color: color.onSurface },
  bodyScroll: { maxHeight: ms(160), marginTop: ms(space[1]), paddingTop: ms(space[2]), borderTopWidth: ms(2), borderStyle: 'dashed', borderColor: color.outline },
  body: { fontFamily: font.mono, fontSize: ms(12), lineHeight: ms(19), color: color.onSurface },
});
