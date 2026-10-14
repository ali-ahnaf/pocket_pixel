// STUB: OpenRouter AI prompt parsing (SEND always reports that AI is not set up). No local data layer for this in packages/app yet, so it uses hardcoded stub data.
import type { TagDto, VaultDto } from '@expense-tracker/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { useDisplaySettings } from '../../hooks/useDisplaySettings';
import { logger, transactionsService } from '../../services';
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

export interface LogResourceSheetProps {
  vaults: VaultDto[];
  tags: TagDto[];
  /** 0-based month on screen. A month other than the current one logs the transaction on its 1st. */
  selectedMonth: number;
  selectedYear: number;
  onSuccess: () => void;
  onClose: () => void;
}

const AI_SETUP_MESSAGE = 'Set up your OpenRouter API key and pick a model in Settings before parsing prompts.';

// Port of packages/ui/src/components/LogResourceModal.tsx.
export function LogResourceSheet({ vaults, tags, selectedMonth, selectedYear, onSuccess, onClose }: LogResourceSheetProps) {
  const userId = useLocalUserId();
  const { height } = useWindowDimensions();
  const { aiTransactionEntryEnabled, loaded: preferencesLoaded } = useDisplaySettings();

  // null follows the preference: AI entry on opens on the prompt, otherwise on the form.
  const [manualEntryOverride, setManualEntryOverride] = useState<boolean | null>(null);
  const manualEntry = aiTransactionEntryEnabled ? (manualEntryOverride ?? false) : true;
  const [promptText, setPromptText] = useState('');
  const [promptResult, setPromptResult] = useState<string | null>(null);

  const [isExpense, setIsExpense] = useState(true);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState<TagDto[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>((vaults.find((v) => v.isDefault) ?? vaults[0])?.id ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        date: isCurrentMonth ? undefined : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`,
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
          <SheetHeader title="LOG NEW RESOURCE" onClose={close} />
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
                <Button label="➤ SEND" size="lg" disabled={!promptText.trim()} onPress={() => setPromptResult(AI_SETUP_MESSAGE)} />
                {promptResult && (
                  <View style={styles.result}>
                    <Text style={styles.resultText}>{promptResult}</Text>
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
              </View>
            )}

            {preferencesLoaded && aiTransactionEntryEnabled && (
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: manualEntry }}
                onPress={() => setManualEntryOverride(!manualEntry)}
                style={({ pressed }) => [styles.manualToggle, pressed && styles.pressed]}
              >
                <Text style={styles.manualLabel}>{manualEntry ? '✦' : '⚙'} MANUAL ENTRY</Text>
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
                <Button label={isSubmitting ? 'RECORDING...' : 'RECORD 📦'} size="lg" disabled={!amount || isSubmitting} onPress={() => submit(close)} style={styles.record} />
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
