import type { GmailLabelDto, OAuthCredentialsStatusDto, TagDto, VaultGmailWatcherDto } from '@expense-tracker/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { SettingsWindow, settingsStyles } from '../../components/settings/SettingsWindow';
import { StatusNote } from '../../components/settings/StatusNote';
import { VaultWatcherCard } from '../../components/settings/VaultWatcherCard';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { gmailService, logger, tagsService, vaultsService, vaultWatchersService } from '../../services';
import { color, gutter, space } from '../../theme';
import { PixelIcon } from '../../components/PixelIcon';

interface VaultOption {
  id: string;
  name: string;
}

const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

// Port of packages/ui/src/app/settings/google-oauth/page.tsx. The web's bring-your-own client id/secret form is gone:
// the app signs in with the native Google SDK, which cannot use a per-user web client.
export default function GoogleOAuthSettingsScreen() {
  const insets = useSafeAreaInsets();
  const userId = useLocalUserId();

  const [status, setStatus] = useState<OAuthCredentialsStatusDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const [labels, setLabels] = useState<GmailLabelDto[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [vaults, setVaults] = useState<VaultOption[]>([]);
  const [watchers, setWatchers] = useState<VaultGmailWatcherDto[]>([]);
  const [watchLoading, setWatchLoading] = useState(true);

  // Loads the connection state and, once connected, the labels, vaults, tags and watchers. Reused after a watcher is saved/removed.
  const load = useCallback(async (): Promise<void> => {
    const nextStatus = await gmailService.getStatus(userId);
    setStatus(nextStatus);
    if (!nextStatus.connected) return;

    setWatchLoading(true);
    try {
      const [labelList, vaultList, watcherList, tagList] = await Promise.all([
        gmailService.listLabels(userId),
        vaultsService.list(userId),
        vaultWatchersService.listForUser(userId),
        tagsService.list(userId),
      ]);
      setLabels(labelList);
      setVaults(vaultList.map((v) => ({ id: v.id, name: v.name })));
      setWatchers(watcherList);
      setTags(tagList);
    } finally {
      setWatchLoading(false);
    }
  }, [userId]);

  const reload = useCallback(() => {
    load().catch((err) => {
      logger.error('Load Gmail settings failed', { err });
      setError(errorMessage(err));
      // A token failure inside listLabels flips the stored status to reconnect; show that.
      gmailService.getStatus(userId).then(setStatus, () => undefined);
    });
  }, [load, userId]);

  useFocusEffect(reload);

  const handleConnect = async (): Promise<void> => {
    setError(null);
    setConnecting(true);
    try {
      if (await gmailService.connect(userId)) reload();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setConnecting(false);
    }
  };

  const connected = status?.connected ?? false;

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

      <SettingsWindow icon="Mail" title="Gmail Connection">
        <View style={settingsStyles.section}>
          <Text style={settingsStyles.hint}>Grant read-only access to your Gmail so bank alert emails can be scanned for transactions. Google will ask you to approve the gmail.readonly scope.</Text>

          {connected && <StatusNote tone="success" icon="Check" label={status?.googleEmail ? `Connected as ${status.googleEmail}` : 'Gmail connected'} />}
          {status?.reconnectRequired && <StatusNote tone="error" icon="TriangleAlert" label="Google expired the connection. Reconnect to resume importing." />}
          {error && <StatusNote tone="error" label={error} />}

          <Button label={connecting ? 'Connecting…' : status?.googleEmail ? 'Reconnect Gmail' : 'Connect Gmail'} variant="primary" size="lg" disabled={connecting} onPress={handleConnect} />
        </View>

        {connected && (
          <View style={[settingsStyles.section, settingsStyles.dividerTop]}>
            <View style={settingsStyles.titleRow}>
              <PixelIcon name="Bell" size={ms(24)} />
              <Text accessibilityRole="header" style={settingsStyles.sectionTitle}>
                Bank Alert Watch
              </Text>
            </View>

            <Text style={settingsStyles.hint}>Attach a Gmail label to a vault. AI reads each matching email and fills in the transaction (amount, title, type and tags) automatically.</Text>

            <StatusNote label="Checks for new mail each time you open the app" />

            {watchLoading ? (
              <Text style={settingsStyles.hint}>Loading vaults…</Text>
            ) : vaults.length === 0 ? (
              <Text style={settingsStyles.hint}>No vaults yet. Create a vault first.</Text>
            ) : (
              <View style={styles.cards}>
                {vaults.map((vault) => (
                  <VaultWatcherCard key={vault.id} vault={vault} watcher={watchers.find((w) => w.vaultId === vault.id)} labels={labels} tags={tags} onChanged={reload} onError={setError} />
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
