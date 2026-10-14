import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { StatusNote } from './StatusNote';

/** OpenRouter key spend as the web's lib/ai/openrouter.ts returns it. Not an API DTO. Values in credits (1 credit = 1 USD). */
export interface OpenRouterUsage {
  readonly label: string;
  readonly keyUsage: number;
  readonly keyLimit: number | null;
  readonly keyLimitRemaining: number | null;
  readonly isFreeTier: boolean;
  readonly totalCredits: number | null;
  readonly totalUsage: number | null;
}

export interface UsagePanelProps {
  usage: OpenRouterUsage | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const formatCredits = (value: number): string => `$${value.toFixed(4)}`;

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function UsagePanel({ usage, loading, error, onRefresh }: UsagePanelProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Usage
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: loading }}
          disabled={loading}
          hitSlop={8}
          onPress={onRefresh}
          style={({ pressed }) => [styles.refresh, pressed && styles.refreshPressed, loading && styles.disabled]}
        >
          <Text style={styles.refreshText}>⟳ Refresh</Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>Spend reported by OpenRouter for the saved key. Fetched directly from your device. Nothing is stored on our server.</Text>

      {error && <StatusNote tone="error" label={error} />}

      {loading && !usage && <Text style={styles.hint}>Loading usage…</Text>}

      {usage && (
        <View style={styles.rows}>
          <UsageRow label="Key" value={usage.label} />
          <UsageRow label="Spent (this key)" value={formatCredits(usage.keyUsage)} />
          <UsageRow label="Key limit" value={usage.keyLimit === null ? 'Unlimited' : formatCredits(usage.keyLimit)} />
          {usage.keyLimitRemaining !== null && <UsageRow label="Limit remaining" value={formatCredits(usage.keyLimitRemaining)} />}
          {usage.totalUsage !== null && <UsageRow label="Spent (account)" value={formatCredits(usage.totalUsage)} />}
          {usage.totalCredits !== null && usage.totalUsage !== null && <UsageRow label="Credits left" value={formatCredits(usage.totalCredits - usage.totalUsage)} />}
          {usage.isFreeTier && <UsageRow label="Tier" value="Free" />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: ms(space[4]) },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ms(space[3]) },
  title: { fontFamily: font.heading, fontSize: ms(18), lineHeight: ms(24), color: color.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  refresh: { borderWidth: ms(4), borderColor: color.border, backgroundColor: color.surface, paddingHorizontal: ms(space[3]), paddingVertical: ms(space[2]) },
  refreshPressed: { transform: [{ translateY: 2 }] },
  refreshText: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(16), color: color.onSurface, textTransform: 'uppercase' },
  disabled: { opacity: 0.5 },
  hint: { fontFamily: font.body, fontSize: ms(12), lineHeight: ms(16), color: color.onSurfaceVariant },
  rows: { gap: ms(space[2]) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(space[3]),
    borderWidth: ms(4),
    borderColor: color.border,
    backgroundColor: color.surface,
    padding: ms(space[3]),
  },
  rowLabel: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(16), color: color.onSurfaceVariant, textTransform: 'uppercase', flexShrink: 1 },
  rowValue: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(16), color: color.onSurface, textTransform: 'uppercase' },
});
