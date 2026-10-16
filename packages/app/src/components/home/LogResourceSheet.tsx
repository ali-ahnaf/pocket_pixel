import type { ParsedEmailDto, TagDto, VaultDto } from '@expense-tracker/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { useDisplaySettings } from '../../hooks/useDisplaySettings';
import { aiService, logger, transactionsService } from '../../services';
import { color, font, shadow, space, text } from '../../theme';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { Input } from '../Input';
import { TransactionTypeToggle } from '../TransactionTypeToggle';
import { AmountInput } from './AmountInput';
import { SheetHeader } from '../SheetHeader';
import { SheetFooterDecor } from './SheetChrome';
import { TagPicker } from './TagPicker';
import { VaultSelect } from './VaultSelect';
import { IconText } from '../IconText';

export interface LogResourceSheetProps {
  vaults: VaultDto[];
  tags: TagDto[];
  /** 0-based month on screen. A month other than the current one logs the transaction on its 1st. */
  selectedMonth: number;
  selectedYear: number;
  /** An AI-parsed email to review: fills the form, skips the AI prompt, and logs on the parsed date. */
  prefill?: ParsedEmailDto & { vaultId: string };
  onSuccess: () => void;
  onClose: () => void;
}

// Port of packages/ui/src/components/LogResourceModal.tsx.
export function LogResourceSheet({ vaults, tags, selectedMonth, selectedYear, prefill, onSuccess, onClose }: LogResourceSheetProps) {
  const userId = useLocalUserId();
  const { height } = useWindowDimensions();
  const { aiTransactionEntryEnabled, loaded: preferencesLoaded } = useDisplaySettings();

  // null follows the preference: AI entry on opens on the prompt, otherwise on the form.
  const [manualEntryOverride, setManualEntryOverride] = useState<boolean | null>(null);
  const manualEntry = aiTransactionEntryEnabled && !prefill ? (manualEntryOverride ?? false) : true;
  const [promptText, setPromptText] = useState('');
  const [promptResult, setPromptResult] = useState<string | null>(null);
  const [isPrompting, setIsPrompting] = useState(false);
  const [promptNeedsAiSetup, setPromptNeedsAiSetup] = useState(false);

  const [isExpense, setIsExpense] = useState(prefill ? prefill.type === 'expense' : true);
  const [amount, setAmount] = useState(prefill ? String(prefill.amount) : '');
  const [title, setTitle] = useState(prefill?.title ?? '');
  const [selectedTags, setSelectedTags] = useState<TagDto[]>(prefill ? tags.filter((tag) => prefill.tagIds.includes(tag.id)) : []);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(prefill?.vaultId ?? (vaults.find((v) => v.isDefault) ?? vaults[0])?.id ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendPrompt = async (): Promise<void> => {
    if (!promptText.trim() || isPrompting) return;
    setIsPrompting(true);
    setPromptResult(null);
    setPromptNeedsAiSetup(false);

    try {
      const outcome = await aiService.parseTransactionPrompt(promptText, tags, vaults);

      if (outcome.status !== 'success') {
        setPromptResult(outcome.message);
        setPromptNeedsAiSetup(outcome.status === 'needs-ai-setup');
        return;
      }

      const parsed = outcome.transaction;
      setTitle(parsed.title);
      setAmount(String(parsed.amount));
      setIsExpense(parsed.type === 'expense');
      setSelectedTags(tags.filter((tag) => parsed.tagIds.includes(tag.id)));
      setSelectedVaultId(parsed.vaultId ?? null);
      setManualEntryOverride(true);
    } catch (err) {
      logger.error('Parse transaction prompt failed', { err });
      setPromptResult(err instanceof Error ? err.message : 'Could not parse your prompt. Please try again.');
      setManualEntryOverride(true);
    } finally {
      setIsPrompting(false);
    }
  };

  const submit = async (close: () => void): Promise<void> => {
    if (!amount || isSubmitting) return;
    setIsSubmitting(true);
    const now = new Date();
    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    try {
      await transactionsService.create(userId, {
        amount: parseFloat(amount),
        type: isExpense ? 'expense' : 'income',
        tagIds: selectedTags.map((t) => t.id),
        title: title || undefined,
        vaultId: selectedVaultId,
        date: prefill?.date ?? (isCurrentMonth ? undefined : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`),
      });
      onSuccess();
      close();
    } catch (err) {
      logger.error('Create transaction failed', { err });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <SheetHeader title={prefill ? 'REVIEW PARSED EMAIL' : 'LOG NEW RESOURCE'} onClose={close} />
          <ScrollView style={{ maxHeight: height * 0.75 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {preferencesLoaded && !manualEntry && (
              <View style={styles.group}>
                <TextInput
                  accessibilityLabel="Describe your transaction"
                  multiline
                  placeholder="Describe your transaction... e.g. Spent 24 on groceries at the market"
                  placeholderTextColor={color.outline}
                  selectionColor={color.primary}
                  value={promptText}
                  onChangeText={setPromptText}
                  style={styles.prompt}
                />
                <Button label={isPrompting ? 'SENDING...' : 'SEND'} icon="Send" size="lg" disabled={!promptText.trim() || isPrompting} onPress={sendPrompt} />
                {promptResult && (
                  <View style={styles.result}>
                    <Text style={styles.resultText}>{promptResult}</Text>
                    {promptNeedsAiSetup && (
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
                    )}
                  </View>
                )}
              </View>
            )}

            {preferencesLoaded && aiTransactionEntryEnabled && !prefill && (
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: manualEntry }}
                onPress={() => setManualEntryOverride(!manualEntry)}
                style={({ pressed }) => [styles.manualToggle, pressed && styles.pressed]}
              >
                <IconText icon={manualEntry ? 'Sparkles' : 'Settings'} style={styles.manualLabel}>
                  MANUAL ENTRY
                </IconText>
                <View style={[styles.switchTrack, manualEntry ? styles.switchOn : styles.switchOff]}>
                  <View style={styles.switchKnob} />
                </View>
              </Pressable>
            )}

            {preferencesLoaded && manualEntry && (
              <>
                <Input accessibilityLabel="Title" placeholder="e.g. Grocery run" value={title} onChangeText={setTitle} style={styles.titleInput} />
                <View style={styles.row}>
                  <AmountInput value={amount} onChangeText={setAmount} />
                </View>
                <TransactionTypeToggle isExpense={isExpense} onChange={setIsExpense} />
                {vaults.length > 0 && <VaultSelect vaults={vaults} value={selectedVaultId} onChange={setSelectedVaultId} />}
                <TagPicker tags={tags} selected={selectedTags} onChange={setSelectedTags} uppercase />
                <Button label={isSubmitting ? 'RECORDING...' : 'RECORD'} icon="Package" size="lg" disabled={!amount || isSubmitting} onPress={() => submit(close)} style={styles.record} />
              </>
            )}

            <SheetFooterDecor />
          </ScrollView>
        </>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: { gap: ms(space[5]), paddingBottom: ms(space[3]) },
  group: { gap: ms(space[3]) },
  row: { flexDirection: 'row' },
  prompt: {
    height: ms(128),
    padding: ms(space[4]),
    backgroundColor: color.surfaceLowest,
    borderWidth: ms(4),
    borderColor: color.border,
    boxShadow: shadow.input,
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: ms(text.bodyLg.fontSize),
    textAlignVertical: 'top',
  },
  result: { padding: ms(space[4]), gap: ms(space[2]), backgroundColor: color.surfaceLowest, borderWidth: ms(4), borderColor: color.border, boxShadow: shadow.input },
  resultText: { fontFamily: font.body, fontSize: ms(text.bodyLg.fontSize), lineHeight: ms(text.bodyLg.lineHeight), color: color.onSurface },
  link: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.primary, textDecorationLine: 'underline' },
  manualToggle: {
    height: ms(48),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(space[4]),
    backgroundColor: color.surfaceLow,
    borderWidth: ms(4),
    borderColor: color.border,
  },
  pressed: { transform: [{ translateY: 2 }] },
  manualLabel: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.onSurface },
  switchTrack: { width: ms(48), height: ms(24), borderWidth: ms(4), borderColor: color.border, flexDirection: 'row', alignItems: 'center' },
  switchOn: { backgroundColor: color.primary, justifyContent: 'flex-end' },
  switchOff: { backgroundColor: color.surfaceHighest, justifyContent: 'flex-start' },
  switchKnob: { width: ms(16), height: ms(16), backgroundColor: color.border },
  titleInput: { height: ms(64) },
  record: { marginTop: ms(space[5]), minHeight: ms(80) },
});
