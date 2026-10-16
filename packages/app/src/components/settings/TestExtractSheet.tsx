import type { AiExtractResultDto, TagDto, TagKeywordRuleDto } from '@expense-tracker/shared';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { Input } from '../Input';
import { settingsStyles } from './SettingsWindow';
import { IconText } from '../IconText';
import { AiSetupLink } from '../AiSetupLink';
import { TagChips } from '../home/TagChips';
import { toAiExtractResult } from '../../lib/ai/gmail-extractor';
import { aiService } from '../../services';

export interface TestExtractSheetProps {
  /** The guidance currently typed in the watcher editor, so the test matches what Save would store. */
  guidanceHint: string;
  /** The transaction day currently typed in the watcher editor, or null when blank. */
  transactionDay: number | null;
  /** The keyword-to-tag rules currently typed in the watcher editor. */
  tagKeywords: TagKeywordRuleDto[];
  tags: TagDto[];
  onClose: () => void;
}

/** Dry-run preview: paste a sample email and see what the AI extractor would resolve it to. Mount to open. */
export function TestExtractSheet({ guidanceHint, transactionDay, tagKeywords, tags, onClose }: TestExtractSheetProps) {
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [emailDate, setEmailDate] = useState('');
  const [bodyText, setBodyText] = useState('');

  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<AiExtractResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAiSetup, setNeedsAiSetup] = useState(false);

  const canTest = bodyText.trim().length > 0;

  // Same extractor as the pending-expense review, run on the pasted sample. Saves nothing.
  const handleTest = async (): Promise<void> => {
    setTesting(true);
    setError(null);
    setResult(null);
    setNeedsAiSetup(false);
    try {
      const outcome = await aiService.extractTransactionFromEmail({ from, subject, bodyText, emailDate: emailDate.trim() || null }, tags, guidanceHint.trim() || null, transactionDay, tagKeywords);
      if (outcome.status === 'needs-ai-setup') {
        setNeedsAiSetup(true);
        setError(outcome.message);
        return;
      }
      setResult(toAiExtractResult(outcome.status === 'success' ? outcome.parsed : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <View style={styles.header}>
            <IconText icon="FlaskConical" iconSize={20} accessibilityRole="header" style={styles.title}>
              Test On Sample Email
            </IconText>
            <Button label="Close" icon="X" variant="ghost" size="sm" onPress={close} />
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
            <Text style={settingsStyles.hint}>Paste a sample email below to preview what the AI would extract, without saving anything.</Text>
            <Input label="From (optional)" value={from} onChangeText={setFrom} placeholder="alerts@bank.com" autoCapitalize="none" keyboardType="email-address" />
            <Input label="Subject (optional)" value={subject} onChangeText={setSubject} placeholder="Debit Alert" />
            <Input label="Email date (optional, defaults to today)" value={emailDate} onChangeText={setEmailDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
            <Input
              label="Body"
              value={bodyText}
              onChangeText={setBodyText}
              placeholder="Paste the full email body text here…"
              multiline
              textAlignVertical="top"
              autoCorrect={false}
              spellCheck={false}
              style={styles.bodyInput}
            />

            {error && (
              <View style={styles.resultBox}>
                <Text style={styles.error}>{error}</Text>
                {needsAiSetup && <AiSetupLink onPress={close} />}
              </View>
            )}

            {result && (
              <View style={styles.resultBox}>
                {result.matched ? (
                  <>
                    <IconText icon="Check" style={styles.matched}>
                      Matched a transaction
                    </IconText>
                    {[
                      ['Title', result.title],
                      ['Amount', result.amount],
                      ['Type', result.type],
                      ['Date', result.date],
                    ].map(([label, value]) => (
                      <View key={label} style={styles.row}>
                        <Text style={styles.rowLabel}>{label}</Text>
                        <Text style={styles.rowValue}>{value}</Text>
                      </View>
                    ))}
                    <TagChips tags={tags.filter((tag) => result.tagIds?.includes(tag.id))} />
                  </>
                ) : (
                  <IconText icon="X" style={styles.unmatched}>
                    Not a transaction. This email would be skipped
                  </IconText>
                )}
              </View>
            )}
          </ScrollView>

          <Button label={testing ? 'Testing…' : 'Run Test'} icon="FlaskConical" variant="primary" size="lg" disabled={!canTest || testing} onPress={handleTest} />
        </>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ms(space[3]) },
  title: { flex: 1, fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), lineHeight: ms(text.headlineMd.lineHeight), color: color.primary, textTransform: 'uppercase' },
  // Fixed height so the sheet does not change size while it slides in.
  body: { height: ms(380) },
  bodyContent: { gap: ms(space[4]), paddingBottom: ms(space[2]) },
  bodyInput: { height: ms(160), fontFamily: font.mono, fontSize: ms(12), lineHeight: ms(18) },
  resultBox: { borderWidth: ms(4), borderColor: color.border, backgroundColor: color.surface, padding: ms(space[3]), gap: ms(space[2]) },
  error: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.error, textTransform: 'uppercase' },
  matched: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.primary, textTransform: 'uppercase' },
  unmatched: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.onSurfaceVariant, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: ms(space[4]) },
  rowLabel: { fontFamily: font.body, fontSize: ms(12), color: color.onSurfaceVariant },
  rowValue: { flexShrink: 1, fontFamily: font.body, fontSize: ms(12), color: color.onSurface, textAlign: 'right' },
});
