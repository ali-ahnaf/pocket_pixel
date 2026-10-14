// STUB: Google OAuth credential status and save, Gmail connect, watch status, Gmail labels and vault watchers. Vaults are real (local vaultsService). No local data layer for the rest in packages/app yet, so it uses hardcoded stub data.
import type { GmailLabelDto, GmailWatchStatusDto, VaultGmailWatcherDto } from '@expense-tracker/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { SettingsWindow, settingsStyles } from '../../components/settings/SettingsWindow';
import { StatusNote } from '../../components/settings/StatusNote';
import { VaultWatcherCard } from '../../components/settings/VaultWatcherCard';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { logger, vaultsService } from '../../services';
import { color, gutter, space } from '../../theme';
import { PixelIcon } from '../../components/PixelIcon';

const STUB_CONFIGURED = true;
const STUB_CONNECTED = true;
const STUB_GOOGLE_EMAIL = 'you@gmail.com';
const STUB_WATCH_STATUS: GmailWatchStatusDto = { watching: true, expiry: null, labelIds: ['Label_1'] };
const STUB_LABELS: GmailLabelDto[] = [
  { id: 'Label_1', name: 'Bank Alerts' },
  { id: 'Label_2', name: 'Card Alerts' },
  { id: 'Label_3', name: 'Receipts' },
];

interface VaultOption {
  id: string;
  name: string;
}

const notAvailable = (what: string): void => Alert.alert('Not available yet', `${what} is not supported in the offline app yet.`);

export default function GoogleOAuthSettingsScreen() {
  const insets = useSafeAreaInsets();
  const userId = useLocalUserId();

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [vaults, setVaults] = useState<VaultOption[]>([]);
  const [watchLoading, setWatchLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      vaultsService
        .list(userId)
        .then((list) => {
          if (!cancelled) setVaults(list.map((v) => ({ id: v.id, name: v.name })));
        })
        .catch((err) => logger.error('Load vaults failed', { err }))
        .finally(() => {
          if (!cancelled) setWatchLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [userId]),
  );

  // Stub: pretend the first vault already has a listener so both card states are visible.
  const watcherFor = (vault: VaultOption, index: number): VaultGmailWatcherDto | undefined =>
    index === 0 ? { vaultId: vault.id, vaultName: vault.name, gmailLabelId: 'Label_1', gmailLabelName: 'Bank Alerts', subjectFilter: 'Debit Alert', guidanceHint: null } : undefined;

  const handleSubmit = (): void => {
    if (!clientId.trim()) return setError('Client ID required');
    if (!clientSecret.trim()) return setError('Client Secret required');
    setError(null);
    notAvailable('Saving Google OAuth credentials');
  };

  return (
    <ScrollView
      // Safe-area padding is applied by hand below; "automatic" would add the top inset a second time on iOS.
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + ms(space[4]), paddingBottom: insets.bottom + ms(space[8]) }]}
    >
      <BackButton />

      <SettingsWindow icon="Shield" title="Setup Google OAuth">
        <View style={settingsStyles.section}>
          <Text style={settingsStyles.hint}>
            Bring your own Google OAuth client to enable Google sign-in for your account. Your Client Secret is encrypted at rest and is never shown again after saving.
          </Text>

          {STUB_CONFIGURED && <StatusNote tone="success" icon="Check" label="Already configured" />}

          <Input
            label="Client ID"
            value={clientId}
            placeholder={STUB_CONFIGURED ? '••••••••••••••••' : undefined}
            onChangeText={(value) => {
              setClientId(value);
              setError(null);
            }}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
          />

          <Input
            label="Client Secret"
            secureTextEntry
            value={clientSecret}
            placeholder={STUB_CONFIGURED ? '••••••••••••••••' : undefined}
            onChangeText={(value) => {
              setClientSecret(value);
              setError(null);
            }}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            error={error ?? undefined}
          />

          <Button label="Save Credentials" variant="primary" size="lg" onPress={handleSubmit} />
        </View>

        {STUB_CONFIGURED && (
          <View style={[settingsStyles.section, settingsStyles.dividerTop]}>
            <View style={settingsStyles.titleRow}>
              <PixelIcon name="Mail" size={ms(24)} />
              <Text accessibilityRole="header" style={settingsStyles.sectionTitle}>
                Gmail Connection
              </Text>
            </View>

            <Text style={settingsStyles.hint}>
              Grant read-only access to your Gmail so bank alert emails can be scanned for transactions. You will be redirected to Google to approve the gmail.readonly scope.
            </Text>

            {STUB_CONNECTED && <StatusNote tone="success" icon="Check" label={STUB_GOOGLE_EMAIL ? `Connected as ${STUB_GOOGLE_EMAIL}` : 'Gmail connected'} />}

            <Button label={STUB_CONNECTED ? 'Reconnect Gmail' : 'Connect Gmail'} variant="primary" size="lg" onPress={() => notAvailable('Connecting Gmail')} />
          </View>
        )}

        {STUB_CONNECTED && (
          <View style={[settingsStyles.section, settingsStyles.dividerTop]}>
            <View style={settingsStyles.titleRow}>
              <PixelIcon name="Bell" size={ms(24)} />
              <Text accessibilityRole="header" style={settingsStyles.sectionTitle}>
                Bank Alert Watch
              </Text>
            </View>

            <Text style={settingsStyles.hint}>Attach a Gmail label to a vault. AI reads each matching email and fills in the transaction (amount, title, type and tags) automatically.</Text>

            {STUB_WATCH_STATUS.watching ? (
              <StatusNote tone="success" icon="Check" label={`Watching${STUB_WATCH_STATUS.expiry ? ` · renews by ${new Date(STUB_WATCH_STATUS.expiry).toLocaleDateString()}` : ''}`} />
            ) : (
              <StatusNote label="Not watching" />
            )}

            {watchLoading ? (
              <Text style={settingsStyles.hint}>Loading vaults…</Text>
            ) : vaults.length === 0 ? (
              <Text style={settingsStyles.hint}>No vaults yet. Create a vault first.</Text>
            ) : (
              <View style={styles.cards}>
                {vaults.map((vault, index) => (
                  <VaultWatcherCard key={vault.id} vault={vault} watcher={watcherFor(vault, index)} labels={STUB_LABELS} onError={setError} />
                ))}
              </View>
            )}
          </View>
        )}
      </SettingsWindow>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: ms(gutter), gap: ms(space[4]) },
  cards: { gap: ms(space[4]) },
});
