import type { GmailLabelDto, TagDto, TagKeywordRuleDto, VaultGmailWatcherDto } from '@expense-tracker/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { Button } from '../Button';
import { Dropdown } from '../Dropdown';
import { Input } from '../Input';
import { settingsStyles } from './SettingsWindow';
import { TestExtractSheet } from './TestExtractSheet';
import { IconText } from '../IconText';
import { PixelIcon } from '../PixelIcon';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { vaultWatchersService } from '../../services';

export interface VaultWatcherCardProps {
  vault: { id: string; name: string };
  /** The vault's watchers, oldest first. */
  watchers: VaultGmailWatcherDto[];
  labels: GmailLabelDto[];
  tags: TagDto[];
  /** Called after a watcher is saved or removed so the screen can reload. */
  onChanged: () => void;
  onError: (message: string) => void;
}

interface ListenerSectionProps extends Omit<VaultWatcherCardProps, 'vault' | 'watchers'> {
  vaultId: string;
  /** Absent for the "add a listener" section. */
  watcher?: VaultGmailWatcherDto;
  /** Whether the vault already has other listeners; only changes the empty-state text. */
  hasListeners: boolean;
}

const NO_LABEL: GmailLabelDto = { id: '', name: 'Select a label…' };

/** One editor row: a keyword and the tag it applies. */
interface KeywordRow {
  keyword: string;
  tagId: string;
}

const EMPTY_ROW: KeywordRow = { keyword: '', tagId: '' };

/** Saved rules as one editor row per keyword, plus a blank row when there are none. */
const toKeywordRows = (rules: TagKeywordRuleDto[] | null | undefined): KeywordRow[] => {
  const rows = (rules ?? []).flatMap((rule) => rule.keywords.map((keyword) => ({ keyword, tagId: rule.tagId })));
  return rows.length > 0 ? rows : [EMPTY_ROW];
};

/** Editor rows back into one rule per tag, skipping rows without a keyword or tag. */
const toKeywordRules = (rows: KeywordRow[]): TagKeywordRuleDto[] => {
  const keywordsByTag = new Map<string, string[]>();
  for (const row of rows) {
    const keyword = row.keyword.trim().toLowerCase();
    if (!keyword || !row.tagId) continue;
    keywordsByTag.set(row.tagId, [...(keywordsByTag.get(row.tagId) ?? []), keyword]);
  }
  return [...keywordsByTag].map(([tagId, keywords]) => ({ tagId, keywords }));
};

/**
 * One card per vault: lists its Gmail watchers ("listeners"), each with its own
 * label, subject filter, guidance, transaction day and tag keywords, plus a
 * section to add another one.
 */
export function VaultWatcherCard({ vault, watchers, ...sectionProps }: VaultWatcherCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <IconText icon="Vault" iconSize={20} numberOfLines={1} style={styles.vaultName}>
          {vault.name}
        </IconText>
        {watchers.length > 0 && (
          <IconText icon="Check" numberOfLines={1} style={styles.attached}>
            {watchers.length === 1 ? '1 listener' : `${watchers.length} listeners`}
          </IconText>
        )}
      </View>

      {watchers.map((watcher, index) => (
        <ListenerSection key={watcher.id ?? index} vaultId={vault.id} watcher={watcher} hasListeners {...sectionProps} />
      ))}
      <ListenerSection vaultId={vault.id} hasListeners={watchers.length > 0} {...sectionProps} />
    </View>
  );
}

/**
 * One listener on a vault: a summary, or its editor with a label dropdown, an
 * optional subject filter, an optional guidance hint, optional keyword-to-tag
 * rules, and a dry-run test sheet. Without `watcher` it adds a new listener.
 */
function ListenerSection({ vaultId, watcher, hasListeners, labels, tags, onChanged, onError }: ListenerSectionProps) {
  const userId = useLocalUserId();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [gmailLabelId, setGmailLabelId] = useState(watcher?.gmailLabelId ?? '');
  const [subjectFilter, setSubjectFilter] = useState(watcher?.subjectFilter ?? '');
  const [guidanceHint, setGuidanceHint] = useState(watcher?.guidanceHint ?? '');
  const [transactionDay, setTransactionDay] = useState(watcher?.transactionDay?.toString() ?? '');
  const [keywordRows, setKeywordRows] = useState<KeywordRow[]>(toKeywordRows(watcher?.tagKeywords));
  const [testOpen, setTestOpen] = useState(false);

  const startEditing = (): void => {
    setGmailLabelId(watcher?.gmailLabelId ?? '');
    setSubjectFilter(watcher?.subjectFilter ?? '');
    setGuidanceHint(watcher?.guidanceHint ?? '');
    setTransactionDay(watcher?.transactionDay?.toString() ?? '');
    setKeywordRows(toKeywordRows(watcher?.tagKeywords));
    setEditing(true);
  };

  const labelName = (id: string): string => labels.find((label) => label.id === id)?.name ?? watcher?.gmailLabelName ?? id;

  const parsedDay = transactionDay.trim() ? Number(transactionDay) : undefined;
  const tagKeywords = toKeywordRules(keywordRows);
  const updateRow = (index: number, change: Partial<KeywordRow>): void => setKeywordRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...change } : row)));
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
      await vaultWatchersService.upsert(
        userId,
        vaultId,
        {
          gmailLabelId,
          gmailLabelName: labels.find((label) => label.id === gmailLabelId)?.name,
          subjectFilter: subjectFilter.trim() || undefined,
          guidanceHint: guidanceHint.trim() || undefined,
          transactionDay: parsedDay,
          tagKeywords,
        },
        watcher?.id,
      );
      setEditing(false);
      onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Saving the listener failed');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    if (!watcher?.id) return;
    setSaving(true);
    try {
      await vaultWatchersService.remove(userId, watcher.id);
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
    <View style={[styles.body, (watcher || hasListeners) && styles.sectionDivider]}>
      {!editing ? (
        <>
          <Text style={settingsStyles.hint}>
            {watcher
              ? `Listening on label "${labelName(watcher.gmailLabelId)}"${watcher.subjectFilter ? ` where subject contains "${watcher.subjectFilter}"` : ''}. AI reads the email and fills in the transaction.`
              : hasListeners
                ? 'Add another listener, for example a second label or a different subject on the same label.'
                : 'No listener attached. Attach a Gmail label and let AI fill in the transaction.'}
          </Text>
          {watcher?.guidanceHint ? <Text style={styles.guidance}>Guidance: {watcher.guidanceHint}</Text> : null}
          {watcher?.transactionDay ? <Text style={styles.guidance}>Booked on day {watcher.transactionDay}</Text> : null}
          {watcher?.tagKeywords?.length ? (
            <Text style={styles.guidance}>Tag keywords: {watcher.tagKeywords.map((rule) => `${tagName(rule.tagId)} (${rule.keywords.join(', ')})`).join('; ')}</Text>
          ) : null}
          <Button label={watcher ? 'Edit Listener' : hasListeners ? 'Add Listener' : 'Attach Listener'} variant={watcher || !hasListeners ? 'primary' : 'secondary'} onPress={startEditing} />
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
              {keywordRows.map((row, index) => {
                const isLast = index === keywordRows.length - 1;
                return (
                  // Rows have no stable id; index keys are fine because both fields are controlled.
                  <View key={index} style={styles.keywordRow}>
                    <View style={styles.keywordCell}>
                      <Input
                        value={row.keyword}
                        onChangeText={(keyword) => updateRow(index, { keyword })}
                        placeholder="e.g. uber"
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.keywordInput}
                      />
                    </View>
                    <View style={styles.keywordCell}>
                      <Dropdown<TagDto | null>
                        options={tags}
                        value={tags.find((tag) => tag.id === row.tagId) ?? null}
                        onChange={(tag) => updateRow(index, { tagId: tag?.id ?? '' })}
                        keyExtractor={(tag) => tag?.id ?? ''}
                        accessibilityLabel="Tag for keyword"
                        renderValue={(tag) => (
                          <Text numberOfLines={1} style={[styles.optionText, !tag && styles.placeholder]}>
                            {tag?.name ?? 'Tag…'}
                          </Text>
                        )}
                        renderOption={(tag) => <Text style={styles.optionText}>{tag?.name}</Text>}
                      />
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={isLast ? 'Add keyword' : 'Remove keyword'}
                      onPress={() => setKeywordRows((rows) => (isLast ? [...rows, EMPTY_ROW] : rows.filter((_, i) => i !== index)))}
                      style={({ pressed }) => [styles.rowButton, pressed && styles.rowButtonPressed]}
                    >
                      <PixelIcon name={isLast ? 'Plus' : 'X'} size={ms(16)} />
                    </Pressable>
                  </View>
                );
              })}
              <Text style={styles.fieldHint}>If the email subject or body contains a keyword, its tag is applied and AI does not pick tags.</Text>
            </View>
          )}

          <Button label="Test On A Pasted Email" icon="FlaskConical" variant="secondary" onPress={() => setTestOpen(true)} />
          <Button label={saving ? 'Saving…' : 'Save Listener'} variant="primary" disabled={saving} onPress={handleSave} />
          <Button label="Cancel" variant="ghost" disabled={saving} onPress={() => setEditing(false)} />
        </>
      )}

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
  sectionDivider: { borderTopWidth: ms(4), borderColor: color.border },
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
  keywordRow: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]) },
  keywordCell: { flex: 1 },
  // Matches the Dropdown trigger so the two fields line up.
  keywordInput: { minHeight: ms(56) },
  rowButton: { width: ms(44), height: ms(44), alignItems: 'center', justifyContent: 'center', borderWidth: ms(4), borderColor: color.border, backgroundColor: color.surfaceHigh },
  rowButtonPressed: { backgroundColor: color.surface },
  guidanceInput: { minHeight: ms(96), fontFamily: font.mono, fontSize: ms(12), lineHeight: ms(18) },
});
