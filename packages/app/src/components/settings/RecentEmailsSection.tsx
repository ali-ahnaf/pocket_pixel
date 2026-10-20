import type { GmailLabelDto, ParsedEmailDto, TagDto, VaultDto } from '@expense-tracker/shared';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { formatDate, toIsoDate } from '../../lib/formatters';
import { gmailService, logger } from '../../services';
import type { GmailRecentMessage } from '../../services/gmail.service';
import { color, font, space, text } from '../../theme';
import { Dropdown } from '../Dropdown';
import { LogResourceSheet } from '../home/LogResourceSheet';
import { PixelIcon } from '../PixelIcon';
import { GmailMessageSheet } from './GmailMessageSheet';
import { settingsStyles } from './SettingsWindow';

export interface RecentEmailsSectionProps {
  /** Labels that have at least one listener; a picked email is routed through that label's listener. */
  labels: GmailLabelDto[];
  /** For the log form that opens when "Review AI-parsed emails" is on. */
  vaults: VaultDto[];
  tags: TagDto[];
  onError: (message: string) => void;
}

const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

/** The last 10 emails on a watched label. Tapping one opens it, where it can be parsed into a transaction. */
export function RecentEmailsSection({ labels, vaults, tags, onError }: RecentEmailsSectionProps) {
  const userId = useLocalUserId();
  const [labelId, setLabelId] = useState(labels[0]?.id ?? '');
  // Tagged with the label they were loaded for, so a label switch shows "Loading" without a setState in the effect.
  const [loaded, setLoaded] = useState<{ labelId: string; messages: GmailRecentMessage[] } | null>(null);
  const [selected, setSelected] = useState<GmailRecentMessage | null>(null);
  const [reviewing, setReviewing] = useState<(ParsedEmailDto & { vaultId: string }) | null>(null);

  // A removed listener can drop the picked label; fall back to the first one.
  const label = labels.find((l) => l.id === labelId) ?? labels[0];
  const loading = !label || loaded?.labelId !== label.id;
  const messages = loaded?.messages ?? [];

  useEffect(() => {
    if (!label) return;
    let active = true;
    gmailService.listRecentMessages(userId, label.id).then(
      (list) => active && setLoaded({ labelId: label.id, messages: list }),
      (err) => {
        logger.error('Load recent Gmail messages failed', { err });
        if (!active) return;
        setLoaded({ labelId: label.id, messages: [] });
        onError(errorMessage(err));
      },
    );
    return () => {
      active = false;
    };
  }, [userId, label, onError]);

  if (!label) return null;

  return (
    <View style={[settingsStyles.section, settingsStyles.dividerTop]}>
      <View style={settingsStyles.titleRow}>
        <PixelIcon name="Mail" size={ms(24)} />
        <Text accessibilityRole="header" style={settingsStyles.sectionTitle}>
          Recent Emails
        </Text>
      </View>

      <Text style={settingsStyles.hint}>The last 10 emails on a watched label. Tap one to read it and parse it into a transaction.</Text>

      <Dropdown
        options={labels}
        value={label}
        onChange={(next) => setLabelId(next.id)}
        keyExtractor={(l) => l.id}
        accessibilityLabel="Gmail label"
        renderValue={(l) => <Text style={styles.optionText}>{l.name}</Text>}
        renderOption={(l) => <Text style={styles.optionText}>{l.name}</Text>}
      />

      {loading ? (
        <Text style={settingsStyles.hint}>Loading emails…</Text>
      ) : messages.length === 0 ? (
        <Text style={settingsStyles.hint}>No emails on this label.</Text>
      ) : (
        <View style={styles.list}>
          {messages.map((message) => (
            <Pressable
              key={message.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${message.subject ?? 'email with no subject'}`}
              onPress={() => setSelected(message)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <View style={styles.itemBody}>
                <Text style={styles.subject} numberOfLines={1}>
                  {message.subject ?? 'No subject'}
                </Text>
                {message.receivedAt ? <Text style={styles.date}>{formatDate(toIsoDate(new Date(message.receivedAt)))}</Text> : null}
              </View>
              <PixelIcon name="ChevronRight" size={ms(20)} />
            </Pressable>
          ))}
        </View>
      )}

      {selected ? (
        <GmailMessageSheet gmailMessageId={selected.id} labelId={label.id} onParsedForReview={(parsed, vaultId) => setReviewing({ ...parsed, vaultId })} onClose={() => setSelected(null)} />
      ) : null}

      {/* Waits for the email sheet to finish closing: iOS cannot present a modal while another is dismissing. */}
      {reviewing && !selected ? (
        <LogResourceSheet
          vaults={vaults}
          tags={tags}
          selectedMonth={new Date().getMonth()}
          selectedYear={new Date().getFullYear()}
          prefill={reviewing}
          onSuccess={() => setReviewing(null)}
          onClose={() => setReviewing(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  optionText: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), color: color.onSurface },
  list: { gap: ms(space[2]) },
  item: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]), minHeight: ms(44), padding: ms(space[3]), backgroundColor: color.bg, borderWidth: ms(4), borderColor: color.border },
  pressed: { transform: [{ translateY: 2 }] },
  itemBody: { flex: 1, gap: ms(space[1]) },
  subject: { fontFamily: font.bodyBold, fontSize: ms(text.bodySm.fontSize), color: color.onSurface },
  date: { fontFamily: font.body, fontSize: ms(11), color: color.onSurfaceVariant },
});
