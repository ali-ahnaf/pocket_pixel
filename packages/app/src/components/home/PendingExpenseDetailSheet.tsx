import type { ParsedEmailDto, PendingExpenseEmailDto, PendingGmailExpenseDto } from '@expense-tracker/shared';
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

export interface PendingExpenseDetailSheetProps {
  item: PendingGmailExpenseDto;
  /** The item left the queue; `transactionCreated` is true when it was parsed into a transaction. */
  onResolved: (id: string, transactionCreated: boolean) => void;
  /** With "Review AI-parsed emails" on: the AI's result, for the user to approve in the log form. Nothing is saved yet. */
  onParsedForReview: (item: PendingGmailExpenseDto, parsed: ParsedEmailDto) => void;
  onClose: () => void;
}

const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

// Port of packages/ui/src/components/pending-expenses/PendingExpenseDetailModal.tsx. Re-fetches the email from Gmail on open.
export function PendingExpenseDetailSheet({ item, onResolved, onParsedForReview, onClose }: PendingExpenseDetailSheetProps) {
  const userId = useLocalUserId();
  const { requireAiParseApproval } = useDisplaySettings();
  const [email, setEmail] = useState<PendingExpenseEmailDto | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'parsing' | 'dismissing' | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [needsAiSetup, setNeedsAiSetup] = useState(false);
  const [unmatched, setUnmatched] = useState(false);

  useEffect(() => {
    let active = true;
    pendingGmailExpenseService.getEmail(userId, item.id).then(
      (fetched) => active && setEmail(fetched),
      (err) => active && setEmailError(errorMessage(err)),
    );
    return () => {
      active = false;
    };
  }, [userId, item.id]);

  const handleParse = async (close: () => void): Promise<void> => {
    if (!email) return;
    setBusy('parsing');
    setParseError(null);
    setNeedsAiSetup(false);
    setUnmatched(false);
    try {
      const outcome = requireAiParseApproval ? await pendingGmailExpenseService.extract(userId, item.id, email) : await pendingGmailExpenseService.parse(userId, item.id, email);
      if (outcome.status === 'success' && requireAiParseApproval) {
        onParsedForReview(item, outcome.parsed);
        close();
      } else if (outcome.status === 'success') {
        showToast(`Logged ${outcome.parsed.title}: ${formatCurrency(outcome.parsed.amount)}`);
        onResolved(item.id, true);
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
      setBusy(null);
    }
  };

  const handleDismiss = async (close: () => void): Promise<void> => {
    setBusy('dismissing');
    setParseError(null);
    try {
      await pendingGmailExpenseService.resolve(userId, item.id);
      onResolved(item.id, false);
      close();
    } catch (err) {
      setParseError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <SheetHeader title="Review Expense" icon="Mail" onClose={close} />
          <Text style={styles.vault}>{item.vaultName}</Text>
          {item.guidanceHint ? <Text style={styles.guidance}>Guidance: {item.guidanceHint}</Text> : null}

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
              <Text style={styles.status}>Not a transaction. Dismiss this item</Text>
            </View>
          )}

          <Button label={busy === 'parsing' ? 'Parsing…' : 'Parse With AI'} icon="Sparkles" disabled={!email || busy !== null} onPress={() => handleParse(close)} />
          <Button label={busy === 'dismissing' ? 'Dismissing…' : 'Dismiss'} icon="Trash" variant="danger" disabled={busy !== null} onPress={() => handleDismiss(close)} />
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
  errorBox: { borderWidth: ms(4), borderColor: color.border, backgroundColor: color.surface, padding: ms(space[3]), gap: ms(space[2]) },
  error: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.error, textTransform: 'uppercase' },
  status: { fontFamily: font.mono, fontSize: ms(11), color: color.onSurfaceVariant, textTransform: 'uppercase' },
});
