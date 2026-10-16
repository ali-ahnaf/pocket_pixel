// STUB: push notifications toggle (local state only). No local data layer for this in packages/app yet, so it uses hardcoded stub data.
import { getDocumentAsync } from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import { shareAsync } from 'expo-sharing';
import { type ReactNode, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { BackButton } from '../../components/BackButton';
import { SettingLink } from '../../components/settings/SettingLink';
import { SettingToggle } from '../../components/settings/SettingToggle';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { useDisplaySettings } from '../../hooks/useDisplaySettings';
import { backupService, logger } from '../../services';
import { color, font, shadow, gutter, space, text } from '../../theme';
import { PixelIcon } from '../../components/PixelIcon';

const REPO_URL = 'https://github.com/ali-ahnaf/pocket_pixel';
const NEW_ISSUE_URL = 'https://github.com/ali-ahnaf/pocket_pixel/issues/new';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showIncome, showExpense, aiTransactionEntryEnabled, setShowIncome, setShowExpense, setAiTransactionEntryEnabled } = useDisplaySettings();
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const userId = useLocalUserId();

  const exportData = async (): Promise<void> => {
    // VACUUM INTO refuses to overwrite, so the previous export in the cache is removed first.
    const file = new File(Paths.cache, `pocket_pixel-${new Date().toISOString().slice(0, 10)}.db`);
    try {
      if (file.exists) file.delete();
      await backupService.export(file.uri);
      await shareAsync(file.uri, { mimeType: 'application/x-sqlite3', dialogTitle: 'Export data' });
    } catch (err: unknown) {
      logger.error('Data export failed', { err });
      Alert.alert('Export failed', err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const restoreBackup = async (): Promise<void> => {
    // The backup is a SQLite file with no fixed extension or MIME type, so any file can be picked.
    const picked = await getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (picked.canceled) return;

    Alert.alert('Restore backup?', `All data on this device for your account will be replaced with "${picked.assets[0].name}". This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        style: 'destructive',
        onPress: () =>
          backupService.restore(userId, picked.assets[0].uri).then(
            (counts) => Alert.alert('Backup restored', `${counts.expenses} transactions, ${counts.vaults} vaults, ${counts.tags} tags and ${counts.debts} debts restored.`),
            (err: unknown) => {
              logger.error('Backup restore failed', { err });
              Alert.alert('Restore failed', err instanceof Error ? err.message : 'Something went wrong');
            },
          ),
      },
    ]);
  };

  return (
    <ScrollView
      // Safe-area padding is applied by hand below; "automatic" would add the top inset a second time on iOS.
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + ms(space[4]), paddingBottom: insets.bottom + ms(space[8]) }]}
    >
      <BackButton />

      <View style={styles.titleBox}>
        <PixelIcon name="Settings" size={ms(28)} />
        <Text accessibilityRole="header" style={styles.title}>
          SETTINGS
        </Text>
      </View>

      <Section title="Dashboard Visibility">
        <SettingToggle label="Show Income" description="Reveal Loot Gained on the home dashboard" icon="TrendingUp" checked={showIncome} onChange={setShowIncome} />
        <SettingToggle label="Show Expense" description="Reveal Gold Spent on the home dashboard" icon="TrendingDown" checked={showExpense} onChange={setShowExpense} />
      </Section>

      <Section title="Transaction Entry">
        <SettingToggle
          label="Enable AI transaction entry"
          description="Open the log modal on the AI prompt instead of the manual form"
          icon="Sparkles"
          checked={aiTransactionEntryEnabled}
          onChange={setAiTransactionEntryEnabled}
        />
      </Section>

      <Section title="Account">
        <SettingToggle label="Push Notifications" description="Get notified when a Gmail watcher logs a transaction" icon="Bell" checked={pushSubscribed} onChange={setPushSubscribed} />
        <SettingLink label="Change Password" description="Update your secret passphrase" icon="Key" onPress={() => router.push('/change-password')} />
      </Section>

      <Section title="Data">
        <SettingLink label="Export Data" description="Save a copy of your SQLite database" icon="Package" onPress={exportData} />
        <SettingLink label="Restore Backup" description="Replace your data with a SQLite backup file" icon="Folder" onPress={restoreBackup} />
      </Section>

      <Section title="Community">
        <SettingLink label="Request a Feature" description="Suggest a new feature" icon="Rocket" onPress={() => Linking.openURL(NEW_ISSUE_URL)} />
        <SettingLink label="Contribute on GitHub" description="View the project repository" icon="Laptop" onPress={() => Linking.openURL(REPO_URL)} />
        <SettingLink label="Report a Bug" description="Report a problem" icon="Bug" onPress={() => Linking.openURL(NEW_ISSUE_URL)} />
        <SettingLink label="Attributions" description="Third-party libraries and assets" icon="BookOpen" onPress={() => router.push('/settings/attributions')} />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: ms(gutter), gap: ms(space[4]) },
  titleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(space[3]),
    backgroundColor: color.surface,
    borderWidth: ms(4),
    borderColor: color.border,
    padding: ms(space[4]),
    boxShadow: shadow.card,
  },
  title: { fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), lineHeight: ms(text.headlineMd.lineHeight), color: color.primary },
  section: { gap: ms(space[4]), backgroundColor: color.surface, borderWidth: ms(4), borderColor: color.border, padding: ms(space[4]) },
  sectionTitle: {
    fontFamily: font.mono,
    fontSize: ms(text.labelCaps.fontSize),
    lineHeight: ms(16),
    color: color.outline,
    textTransform: 'uppercase',
    borderBottomWidth: ms(4),
    borderColor: color.border,
    paddingBottom: ms(space[2]),
  },
});
