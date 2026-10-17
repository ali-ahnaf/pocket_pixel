import type { ParsedEmailDto, PendingExpenseEmailDto } from '@expense-tracker/shared';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { useDisplaySettings } from '../../hooks/useDisplaySettings';
import { formatCurrency } from '../../lib/formatters';
import { pendingGmailExpenseService } from '../../services';
import { color, font, space, text } from '../../theme';
import { AiSetupLink } from '../AiSetupLink';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { EmailPreview } from '../EmailPreview';
import { SheetHeader } from '../SheetHeader';
import { showToast } from '../Toast';

export interface GmailMessageSheetProps {
  gmailMessageId: string;
  /** The watched label the message was picked from; its listener supplies the vault and parse settings. */
  labelId: string;
  /** With "Review AI-parsed emails" on: the AI's result, for the user to approve in the log form. Nothing is saved yet. */
  onParsedForReview: (parsed: ParsedEmailDto, vaultId: string) => void;
  onClose: () => void;
}

const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

// Shows any recent email on a watched label and parses it on demand. Unlike PendingExpenseDetailSheet it never touches
// the pending queue, so an email can be parsed again after it was parsed or dismissed.
export function GmailMessageSheet({ gmailMessageId, labelId, onParsedForReview, onClose }: GmailMessageSheetProps) {
  const userId = useLocalUserId();
  const { requireAiParseApproval } = useDisplaySettings();
  const [email, setEmail] = useState<PendingExpenseEmailDto | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [needsAiSetup, setNeedsAiSetup] = useState(false);
  const [unmatched, setUnmatched] = useState(false);

  useEffect(() => {
    let active = true;
    pendingGmailExpenseService.getMessageEmail(userId, gmailMessageId).then(
      (fetched) => active && setEmail(fetched),
      (err) => active && setEmailError(errorMessage(err)),
    );
    return () => {
      active = false;
    };
  }, [userId, gmailMessageId]);

  const handleParse = async (close: () => void): Promise<void> => {
    if (!email) return;
    setParsing(true);
    setParseError(null);
    setNeedsAiSetup(false);
    setUnmatched(false);
    try {
      const { outcome, vaultId } = await pendingGmailExpenseService.parseMessage(userId, labelId, email, !requireAiParseApproval);
      if (outcome.status === 'success' && requireAiParseApproval) {
        onParsedForReview(outcome.parsed, vaultId);
        close();
      } else if (outcome.status === 'success') {
        showToast(`Logged ${outcome.parsed.title}: ${formatCurrency(outcome.parsed.amount)}`);
        close();
      } else if (outcome.status === 'needs-ai-setup') {
        setNeedsAiSetup(true);
        setParseError(outcome.message);
      } else {
        setUnmatched(true);
      }
    } catch (err) {
      setParseError(errorMessage(err));
    } finally {
      setParsing(false);
    }
  };

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <SheetHeader title="Email" icon="Mail" onClose={close} />

          {!email && !emailError && <Text style={styles.status}>Fetching the email…</Text>}
          {emailError && (
            <View style={styles.errorBox}>
              <Text style={styles.error}>{emailError}</Text>
            </View>
          )}

          {email && <EmailPreview email={email} />}

          {parseError && (
            <View style={styles.errorBox}>
              <Text style={styles.error}>{parseError}</Text>
              {needsAiSetup && <AiSetupLink onPress={close} />}
            </View>
          )}

          {unmatched && (
            <View style={styles.errorBox}>
              <Text style={styles.status}>Not a transaction</Text>
            </View>
          )}

          <Button label={parsing ? 'Parsing…' : 'Parse With AI'} icon="Sparkles" disabled={!email || parsing} onPress={() => handleParse(close)} />
        </>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  errorBox: { borderWidth: ms(4), borderColor: color.border, backgroundColor: color.surface, padding: ms(space[3]), gap: ms(space[2]) },
  error: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.error, textTransform: 'uppercase' },
  status: { fontFamily: font.mono, fontSize: ms(11), color: color.onSurfaceVariant, textTransform: 'uppercase' },
});
