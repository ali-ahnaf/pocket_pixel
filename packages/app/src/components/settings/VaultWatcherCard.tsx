// STUB: saving and removing a Gmail watcher (Alert only). No local data layer for this in packages/app yet, so it uses hardcoded stub data.
import type { GmailLabelDto, VaultGmailWatcherDto } from '@expense-tracker/shared';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { Button } from '../Button';
import { Dropdown } from '../Dropdown';
import { Input } from '../Input';
import { settingsStyles } from './SettingsWindow';
import { TestExtractSheet } from './TestExtractSheet';

export interface VaultWatcherCardProps {
  vault: { id: string; name: string };
  watcher?: VaultGmailWatcherDto;
  labels: GmailLabelDto[];
  onError: (message: string) => void;
}

const NO_LABEL: GmailLabelDto = { id: '', name: 'Select a label…' };

const notAvailable = (): void => Alert.alert('Not available yet', 'Gmail watchers are not supported in the offline app yet.');

/**
 * One card per vault: shows its attached Gmail watcher (label + AI extraction
 * guidance) or an "attach listener" editor with a label dropdown, an optional
 * subject filter, an optional guidance hint, and a dry-run test sheet.
 */
export function VaultWatcherCard({ vault, watcher, labels, onError }: VaultWatcherCardProps) {
  const [editing, setEditing] = useState(false);
  const [gmailLabelId, setGmailLabelId] = useState(watcher?.gmailLabelId ?? '');
  const [subjectFilter, setSubjectFilter] = useState(watcher?.subjectFilter ?? '');
  const [guidanceHint, setGuidanceHint] = useState(watcher?.guidanceHint ?? '');
  const [testOpen, setTestOpen] = useState(false);

  const startEditing = (): void => {
    setGmailLabelId(watcher?.gmailLabelId ?? '');
    setSubjectFilter(watcher?.subjectFilter ?? '');
    setGuidanceHint(watcher?.guidanceHint ?? '');
    setEditing(true);
  };

  const labelName = (id: string): string => labels.find((label) => label.id === id)?.name ?? watcher?.gmailLabelName ?? id;

  const handleSave = (): void => {
    if (!gmailLabelId) {
      onError('Pick a Gmail label to attach to this vault');
      return;
    }
    notAvailable();
  };

  const selectedLabel = labels.find((label) => label.id === gmailLabelId) ?? NO_LABEL;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text numberOfLines={1} style={styles.vaultName}>
          🏦 {vault.name}
        </Text>
        {watcher && !editing && (
          <Text numberOfLines={1} style={styles.attached}>
            ✔ {labelName(watcher.gmailLabelId)}
          </Text>
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
            <Button label={watcher ? 'Edit Listener' : 'Attach Listener'} variant="primary" onPress={startEditing} />
            {watcher && <Button label="🗑 Remove" variant="danger" onPress={notAvailable} />}
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

            <Button label="🧪 Test On A Pasted Email" variant="secondary" onPress={() => setTestOpen(true)} />
            <Button label="Save Listener" variant="primary" onPress={handleSave} />
            <Button label="Cancel" variant="ghost" onPress={() => setEditing(false)} />
          </>
        )}
      </View>

      {testOpen && <TestExtractSheet onClose={() => setTestOpen(false)} />}
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
