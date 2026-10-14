// STUB: AI test extraction (Run Test). No local data layer for this in packages/app yet, so it uses hardcoded stub data.
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { Input } from '../Input';
import { settingsStyles } from './SettingsWindow';

export interface TestExtractSheetProps {
  onClose: () => void;
}

/** Dry-run preview: paste a sample email and see what the AI extractor would resolve it to. Mount to open. */
export function TestExtractSheet({ onClose }: TestExtractSheetProps) {
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [emailDate, setEmailDate] = useState('');
  const [bodyText, setBodyText] = useState('');

  const canTest = bodyText.trim().length > 0;

  const handleTest = (): void => {
    Alert.alert('Not available yet', 'Testing the AI extractor is not supported in the offline app yet.');
  };

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              🧪 Test On Sample Email
            </Text>
            <Button label="✕" variant="ghost" size="sm" onPress={close} />
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
          </ScrollView>

          <Button label="🧪 Run Test" variant="primary" size="lg" disabled={!canTest} onPress={handleTest} />
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
});
