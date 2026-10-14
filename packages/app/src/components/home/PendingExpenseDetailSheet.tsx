// STUB: Gmail email re-fetch (hardcoded email) and OpenRouter AI parsing (always reports that AI is not set up). No local data layer for this in packages/app yet, so it uses hardcoded stub data.
import type { PendingExpenseEmailDto, PendingGmailExpenseDto } from '@expense-tracker/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { SheetHeader } from '../SheetHeader';

const STUB_EMAIL: PendingExpenseEmailDto = {
  from: 'alerts@examplebank.com',
  subject: 'Card purchase alert',
  bodyText: 'Your card ending 1234 was used for BDT 450.00 at CITY GROCERS on 12-Oct-2026.',
  emailDate: '2026-10-12T09:30:00Z',
};

export interface PendingExpenseDetailSheetProps {
  item: PendingGmailExpenseDto;
  onResolved: (id: string) => void;
  onClose: () => void;
}

// Port of packages/ui/src/components/pending-expenses/PendingExpenseDetailModal.tsx.
export function PendingExpenseDetailSheet({ item, onResolved, onClose }: PendingExpenseDetailSheetProps) {
  const [parseError, setParseError] = useState<string | null>(null);

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <SheetHeader title="Review Expense" icon="Mail" onClose={close} />
          <Text style={styles.vault}>{item.vaultName}</Text>
          {item.guidanceHint ? <Text style={styles.guidance}>Guidance: {item.guidanceHint}</Text> : null}

          <View style={styles.email}>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>From</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {STUB_EMAIL.from}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Subject</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {STUB_EMAIL.subject}
              </Text>
            </View>
            <ScrollView style={styles.bodyScroll}>
              <Text style={styles.body} selectable>
                {STUB_EMAIL.bodyText}
              </Text>
            </ScrollView>
          </View>

          {parseError && (
            <View style={styles.errorBox}>
              <Text style={styles.error}>{parseError}</Text>
              <Pressable
                accessibilityRole="link"
                hitSlop={10}
                onPress={() => {
                  close();
                  router.push('/settings/ai');
                }}
              >
                <Text style={styles.link}>GO TO SETTINGS</Text>
              </Pressable>
            </View>
          )}

          <Button label="Parse With AI" icon="Sparkles" onPress={() => setParseError('Set up your OpenRouter API key in Settings before parsing this email.')} />
          <Button
            label="Dismiss"
            icon="Trash"
            variant="danger"
            onPress={() => {
              onResolved(item.id);
              close();
            }}
          />
        </>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  vault: {
    alignSelf: 'flex-start',
    fontFamily: font.mono,
    fontSize: ms(10),
    color: color.onSurface,
    textTransform: 'uppercase',
    paddingHorizontal: ms(space[2]),
    paddingVertical: ms(space[1]),
    borderWidth: ms(2),
    borderColor: color.border,
    backgroundColor: color.surfaceHighest,
  },
  guidance: {
    fontFamily: font.mono,
    fontSize: ms(11),
    color: color.onSurfaceVariant,
    borderWidth: ms(4),
    borderColor: color.border,
    backgroundColor: color.surfaceHigh,
    paddingHorizontal: ms(space[3]),
    paddingVertical: ms(space[2]),
  },
  email: { borderWidth: ms(4), borderColor: color.border, backgroundColor: color.surfaceLowest, padding: ms(space[3]), gap: ms(space[1]) },
  metaRow: { flexDirection: 'row', gap: ms(space[3]) },
  metaKey: { width: ms(56), fontFamily: font.body, fontSize: ms(12), color: color.onSurfaceVariant },
  metaValue: { flex: 1, fontFamily: font.body, fontSize: ms(12), color: color.onSurface },
  bodyScroll: { maxHeight: ms(160), marginTop: ms(space[1]), paddingTop: ms(space[2]), borderTopWidth: ms(2), borderStyle: 'dashed', borderColor: color.outline },
  body: { fontFamily: font.mono, fontSize: ms(12), lineHeight: ms(19), color: color.onSurface },
  errorBox: { borderWidth: ms(4), borderColor: color.border, backgroundColor: color.surface, padding: ms(space[3]), gap: ms(space[2]) },
  error: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.error, textTransform: 'uppercase' },
  link: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.primary, textDecorationLine: 'underline' },
});
