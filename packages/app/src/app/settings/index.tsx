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
import { Dropdown } from '../../components/Dropdown';
import { SettingLink } from '../../components/settings/SettingLink';
import { SettingToggle } from '../../components/settings/SettingToggle';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { useDisplaySettings } from '../../hooks/useDisplaySettings';
import { setRecapTaskEnabled } from '../../lib/notifications/monthly-recap-task';
import { recapNotifier } from '../../lib/notifications/recap-notifier';
import { backupService, logger } from '../../services';
import { color, font, shadow, gutter, space, text } from '../../theme';
import { PixelIcon } from '../../components/PixelIcon';

const REPO_URL = 'https://github.com/ali-ahnaf/pocket_pixel';
const NEW_ISSUE_URL = 'https://github.com/ali-ahnaf/pocket_pixel/issues/new';

// Capped at 28 so every month has the day. null turns the recap off.
const RECAP_DAYS: (number | null)[] = [null, ...Array.from({ length: 28 }, (_, i) => i + 1)];
const recapDayLabel = (day: number | null): string => (day ? `Day ${day} of each month` : 'Off');

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
  const { showIncome, showExpense, aiTransactionEntryEnabled, monthlyRecapDay, setShowIncome, setShowExpense, setAiTransactionEntryEnabled, setMonthlyRecapDay } = useDisplaySettings();
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const userId = useLocalUserId();

  // The recap arrives as a notification, so a day can only be set once notifications are allowed.
  const changeRecapDay = async (day: number | null): Promise<void> => {
    try {
      if (day !== null && !(await recapNotifier.requestPermission())) {
        Alert.alert('Notifications are off', 'Allow notifications for Pocket Pixel in your phone settings to get the monthly recap.');
        return;
      }
      await setRecapTaskEnabled(day !== null);
      setMonthlyRecapDay(day);
    } catch (err: unknown) {
      logger.error('Monthly recap setup failed', { err });
      Alert.alert('Could not schedule the recap', err instanceof Error ? err.message : 'Something went wrong');
    }
  };

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

      <Section title="Monthly Recap">
        <Text style={styles.note}>
          Aldric sends a notification summing up last month: your top guilds, the change from the month before, and your debts. Your phone decides the exact time, so it can arrive a few hours into the
          day. Needs AI setup.
        </Text>
        <Dropdown
          options={RECAP_DAYS}
          value={monthlyRecapDay}
          onChange={changeRecapDay}
          keyExtractor={(day) => day ?? 0}
          renderValue={(day) => <Text style={styles.dropdownText}>{recapDayLabel(day)}</Text>}
          renderOption={(day) => <Text style={styles.dropdownText}>{recapDayLabel(day)}</Text>}
          accessibilityLabel="Monthly recap day"
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
  note: { fontFamily: font.body, fontSize: ms(12), lineHeight: ms(16), color: color.onSurfaceVariant },
  dropdownText: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurface },
});
