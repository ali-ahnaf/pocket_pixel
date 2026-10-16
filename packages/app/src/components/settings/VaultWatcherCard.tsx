import type { GmailLabelDto, TagDto, TagKeywordRuleDto, VaultGmailWatcherDto } from '@expense-tracker/shared';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { Button } from '../Button';
import { Dropdown } from '../Dropdown';
import { Input } from '../Input';
import { settingsStyles } from './SettingsWindow';
import { TestExtractSheet } from './TestExtractSheet';
import { IconText } from '../IconText';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { vaultWatchersService } from '../../services';

export interface VaultWatcherCardProps {
  vault: { id: string; name: string };
  watcher?: VaultGmailWatcherDto;
  labels: GmailLabelDto[];
  tags: TagDto[];
  /** Called after the watcher is saved or removed so the screen can reload. */
  onChanged: () => void;
  onError: (message: string) => void;
}

const NO_LABEL: GmailLabelDto = { id: '', name: 'Select a label…' };

/** Saved rules as the editor's comma-separated text per tag id. */
const toKeywordText = (rules: TagKeywordRuleDto[] | null | undefined): Record<string, string> => Object.fromEntries((rules ?? []).map((rule) => [rule.tagId, rule.keywords.join(', ')]));

/** The editor's comma-separated text back into rules, skipping tags left blank. */
const toKeywordRules = (tags: TagDto[], text: Record<string, string>): TagKeywordRuleDto[] =>
  tags
    .map((tag) => ({
      tagId: tag.id,
      keywords: (text[tag.id] ?? '')
        .split(',')
        .map((keyword) => keyword.trim().toLowerCase())
        .filter(Boolean),
    }))
    .filter((rule) => rule.keywords.length > 0);

/**
 * One card per vault: shows its attached Gmail watcher (label + AI extraction
 * guidance) or an "attach listener" editor with a label dropdown, an optional
 * subject filter, an optional guidance hint, optional keyword-to-tag rules, and a
 * dry-run test sheet.
 */
export function VaultWatcherCard({ vault, watcher, labels, tags, onChanged, onError }: VaultWatcherCardProps) {
  const userId = useLocalUserId();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [gmailLabelId, setGmailLabelId] = useState(watcher?.gmailLabelId ?? '');
  const [subjectFilter, setSubjectFilter] = useState(watcher?.subjectFilter ?? '');
  const [guidanceHint, setGuidanceHint] = useState(watcher?.guidanceHint ?? '');
  const [transactionDay, setTransactionDay] = useState(watcher?.transactionDay?.toString() ?? '');
  const [keywordText, setKeywordText] = useState<Record<string, string>>(toKeywordText(watcher?.tagKeywords));
  const [testOpen, setTestOpen] = useState(false);

  const startEditing = (): void => {
    setGmailLabelId(watcher?.gmailLabelId ?? '');
    setSubjectFilter(watcher?.subjectFilter ?? '');
    setGuidanceHint(watcher?.guidanceHint ?? '');
    setTransactionDay(watcher?.transactionDay?.toString() ?? '');
    setKeywordText(toKeywordText(watcher?.tagKeywords));
    setEditing(true);
  };

  const labelName = (id: string): string => labels.find((label) => label.id === id)?.name ?? watcher?.gmailLabelName ?? id;

  const parsedDay = transactionDay.trim() ? Number(transactionDay) : undefined;
  const tagKeywords = toKeywordRules(tags, keywordText);
  const tagName = (id: string): string => tags.find((tag) => tag.id === id)?.name ?? 'Deleted tag';

  const handleSave = async (): Promise<void> => {
    if (!gmailLabelId) {
      onError('Pick a Gmail label to attach to this vault');
      return;
    }
    if (parsedDay !== undefined && !(Number.isInteger(parsedDay) && parsedDay >= 1 && parsedDay <= 31)) {
      onError('Transaction day must be a whole number from 1 to 31');
      return;
    }
    setSaving(true);
    try {
      await vaultWatchersService.upsert(userId, vault.id, {
        gmailLabelId,
        gmailLabelName: labels.find((label) => label.id === gmailLabelId)?.name,
        subjectFilter: subjectFilter.trim() || undefined,
        guidanceHint: guidanceHint.trim() || undefined,
        transactionDay: parsedDay,
        tagKeywords,
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Saving the listener failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    setSaving(true);
    try {
      await vaultWatchersService.remove(userId, vault.id);
      setEditing(false);
      onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Removing the listener failed');
    } finally {
      setSaving(false);
    }
  };

  const selectedLabel = labels.find((label) => label.id === gmailLabelId) ?? NO_LABEL;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <IconText icon="Vault" iconSize={20} numberOfLines={1} style={styles.vaultName}>
          {vault.name}
        </IconText>
        {watcher && !editing && (
          <IconText icon="Check" numberOfLines={1} style={styles.attached}>
            {labelName(watcher.gmailLabelId)}
          </IconText>
        )}
      </View>

      <View style={styles.body}>
        {!editing ? (
          <>
            <Text style={settingsStyles.hint}>
              {watcher
                ? `Listening on label "${labelName(watcher.gmailLabelId)}"${watcher.subjectFilter ? ` where subject contains "${watcher.subjectFilter}"` : ''}. AI reads the email and fills in the transaction.`
                : 'No listener attached. Attach a Gmail label and let AI fill in the transaction.'}
            </Text>
            {watcher?.guidanceHint ? <Text style={styles.guidance}>Guidance: {watcher.guidanceHint}</Text> : null}
            {watcher?.transactionDay ? <Text style={styles.guidance}>Booked on day {watcher.transactionDay}</Text> : null}
            {watcher?.tagKeywords?.length ? (
              <Text style={styles.guidance}>Tag keywords: {watcher.tagKeywords.map((rule) => `${tagName(rule.tagId)} (${rule.keywords.join(', ')})`).join('; ')}</Text>
            ) : null}
            <Button label={watcher ? 'Edit Listener' : 'Attach Listener'} variant="primary" onPress={startEditing} />
            {watcher && <Button label="Remove" icon="Trash" variant="danger" disabled={saving} onPress={handleRemove} />}
          </>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Gmail label</Text>
              <Dropdown
                options={labels}
                value={selectedLabel}
                onChange={(label) => setGmailLabelId(label.id)}
                keyExtractor={(label) => label.id}
                accessibilityLabel="Gmail label"
                renderValue={(label) => <Text style={[styles.optionText, !label.id && styles.placeholder]}>{label.name}</Text>}
                renderOption={(label) => <Text style={styles.optionText}>{label.name}</Text>}
              />
            </View>

            <View style={styles.field}>
              <Input label="Subject filter (optional)" value={subjectFilter} onChangeText={setSubjectFilter} placeholder="e.g. Debit Alert. Leave blank to match any subject" />
              <Text style={styles.fieldHint}>Case-insensitive substring. Only emails whose subject contains this fire this vault.</Text>
            </View>

            <View style={styles.field}>
              <Input
                label="Guidance for AI (optional)"
                value={guidanceHint}
                onChangeText={setGuidanceHint}
                placeholder="e.g. these are always groceries, ignore reward-point emails"
                multiline
                textAlignVertical="top"
                spellCheck={false}
                autoCorrect={false}
                style={styles.guidanceInput}
              />
              <Text style={styles.fieldHint}>AI reads the email and fills in the transaction (amount, title, type, tags). This nudge is appended to its prompt.</Text>
            </View>

            <View style={styles.field}>
              <Input
                label="Transaction day (optional)"
                value={transactionDay}
                onChangeText={setTransactionDay}
                placeholder="e.g. 25. Leave blank to use the email's date"
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.fieldHint}>Replaces the email&apos;s date. Transactions are always booked on this day of the month after the email&apos;s month.</Text>
            </View>

            {tags.length > 0 && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Tag keywords (optional)</Text>
                <Text style={styles.fieldHint}>Comma-separated. If the email subject or body contains a keyword, that tag is applied and AI does not pick tags.</Text>
                {tags.map((tag) => (
                  <Input
                    key={tag.id}
                    label={tag.name}
                    value={keywordText[tag.id] ?? ''}
                    onChangeText={(value) => setKeywordText((current) => ({ ...current, [tag.id]: value }))}
                    placeholder="e.g. uber, pathao"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                ))}
              </View>
            )}

            <Button label="Test On A Pasted Email" icon="FlaskConical" variant="secondary" onPress={() => setTestOpen(true)} />
            <Button label={saving ? 'Saving…' : 'Save Listener'} variant="primary" disabled={saving} onPress={handleSave} />
            <Button label="Cancel" variant="ghost" disabled={saving} onPress={() => setEditing(false)} />
          </>
        )}
      </View>

      {testOpen && <TestExtractSheet guidanceHint={guidanceHint} transactionDay={parsedDay ?? null} tagKeywords={tagKeywords} tags={tags} onClose={() => setTestOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: ms(4), borderColor: color.border, backgroundColor: color.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(space[2]),
    borderBottomWidth: ms(4),
    borderColor: color.border,
    backgroundColor: color.surfaceHigh,
    paddingHorizontal: ms(space[4]),
    paddingVertical: ms(space[3]),
  },
  vaultName: { flexShrink: 1, fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(16), color: color.onSurface, textTransform: 'uppercase', letterSpacing: 0.6 },
  attached: { flexShrink: 0, maxWidth: '50%', fontFamily: font.mono, fontSize: ms(11), color: color.primary, textTransform: 'uppercase' },
  body: { paddingHorizontal: ms(space[4]), paddingVertical: ms(space[4]), gap: ms(space[3]) },
  guidance: {
    borderWidth: ms(4),
    borderColor: color.border,
    backgroundColor: color.surfaceHigh,
    paddingHorizontal: ms(space[3]),
    paddingVertical: ms(space[2]),
    fontFamily: font.mono,
    fontSize: ms(11),
    lineHeight: ms(15),
    color: color.onSurfaceVariant,
  },
  field: { gap: ms(space[1]) },
  fieldLabel: {
    fontFamily: font.mono,
    fontSize: ms(text.labelCaps.fontSize),
    lineHeight: ms(text.labelCaps.lineHeight),
    color: color.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: ms(space[1]),
  },
  fieldHint: { fontFamily: font.body, fontSize: ms(11), lineHeight: ms(15), color: color.onSurfaceVariant },
  optionText: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), color: color.onSurface },
  placeholder: { color: color.onSurfaceVariant },
  guidanceInput: { minHeight: ms(96), fontFamily: font.mono, fontSize: ms(12), lineHeight: ms(18) },
});
