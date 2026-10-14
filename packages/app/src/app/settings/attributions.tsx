// STUB: GitHub contributors roster (the web page fetches it from the GitHub API). No local data layer for this in packages/app yet, so it uses hardcoded stub data.
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { BackButton } from '../../components/BackButton';
import { AVATARS, avatarSource } from '../../lib/static';
import { color, font, shadow, gutter, space, text } from '../../theme';
import { PixelIcon } from '../../components/PixelIcon';
import { IconText } from '../../components/IconText';

const REPO_CONTRIBUTORS_PAGE = 'https://github.com/ali-ahnaf/pocket_pixel/graphs/contributors';

interface Contributor {
  readonly id: number;
  readonly login: string;
  readonly contributions: number;
  readonly avatar: string;
}

interface Rank {
  readonly name: string;
  readonly max: number;
  readonly color: string;
}

/**
 * Rank ladder mirrored from `.github/workflows/contributors.yml` so the in-app
 * roster and the README roster award the same title for the same commit count.
 * `max` is the highest commit count that still earns the rank. Colors are badge data, not theme tokens.
 */
const RANKS: readonly Rank[] = [
  { name: 'MONK', max: 1, color: '#dd6b20' },
  { name: 'KNIGHT', max: 3, color: '#c0c0c0' },
  { name: 'MAGE', max: 5, color: '#8b5cf6' },
  { name: 'ROGUE', max: 8, color: '#2f855a' },
  { name: 'RANGER', max: 11, color: '#38a169' },
  { name: 'CLERIC', max: 15, color: '#f6e05e' },
  { name: 'BARD', max: 19, color: '#ed64a6' },
  { name: 'PALADIN', max: 24, color: '#f6ad55' },
  { name: 'WARRIOR', max: 29, color: '#e53e3e' },
  { name: 'DRUID', max: 34, color: '#48bb78' },
  { name: 'SORCERER', max: 39, color: '#9f7aea' },
  { name: 'ALCHEMIST', max: 44, color: '#319795' },
  { name: 'ARCHER', max: 49, color: '#3182ce' },
  { name: 'BERSERKER', max: 54, color: '#c53030' },
  { name: 'ENCHANTER', max: 60, color: '#6b46c1' },
];

const GUILD_MASTER: Rank = { name: 'GUILD MASTER', max: Number.POSITIVE_INFINITY, color: '#ffd700' };

const rankFor = (contributions: number): Rank => RANKS.find((rank) => contributions <= rank.max) ?? GUILD_MASTER;

const STUB_CONTRIBUTORS: readonly Contributor[] = [
  { id: 1, login: 'contributor-one', contributions: 72, avatar: AVATARS[0] },
  { id: 2, login: 'contributor-two', contributions: 18, avatar: AVATARS[1] },
  { id: 3, login: 'contributor-three', contributions: 6, avatar: AVATARS[2] },
  { id: 4, login: 'contributor-four', contributions: 2, avatar: AVATARS[3] },
  { id: 5, login: 'contributor-five', contributions: 1, avatar: AVATARS[4] },
];

const openContributors = (): void => {
  Linking.openURL(REPO_CONTRIBUTORS_PAGE);
};

export default function AttributionsScreen() {
  const insets = useSafeAreaInsets();
  const contributors = STUB_CONTRIBUTORS;

  return (
    <ScrollView
      // Safe-area padding is applied by hand below; "automatic" would add the top inset a second time on iOS.
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + ms(space[4]), paddingBottom: insets.bottom + ms(space[8]) }]}
    >
      <BackButton href="/settings" />

      <View style={styles.titleBox}>
        <View style={styles.iconBox}>
          <PixelIcon name="BookOpen" size={ms(24)} />
        </View>
        <View style={styles.titleTexts}>
          <Text accessibilityRole="header" style={styles.title}>
            ATTRIBUTIONS
          </Text>
          <Text style={styles.subtitle}>The heroes who built Pocket Pixel</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text accessibilityRole="header" style={styles.panelTitle}>
            Contributors
          </Text>
          <View style={styles.countBadge}>
            <IconText icon="Users" style={styles.countText}>
              {contributors.length} heroes
            </IconText>
          </View>
        </View>

        <View style={styles.grid}>
          {contributors.map((contributor) => {
            const rank = rankFor(contributor.contributions);
            return (
              <Pressable
                key={contributor.id}
                accessibilityRole="link"
                accessibilityLabel={`${contributor.login}, ${contributor.contributions} commits`}
                onPress={openContributors}
                style={({ pressed }) => [styles.hero, pressed && styles.heroPressed]}
              >
                <Image source={avatarSource(contributor.avatar)} style={styles.avatar} accessibilityIgnoresInvertColors />
                <Text numberOfLines={1} style={styles.login}>
                  {contributor.login}
                </Text>
                <View style={[styles.rankBadge, { backgroundColor: rank.color }]}>
                  <Text numberOfLines={1} style={styles.rankText}>
                    LVL {contributor.contributions} · {rank.name}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
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
  iconBox: { width: ms(40), height: ms(40), borderWidth: ms(2), borderColor: color.border, alignItems: 'center', justifyContent: 'center', backgroundColor: color.secondaryContainer },
  titleTexts: { flex: 1, minWidth: 0 },
  title: { fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), lineHeight: ms(text.headlineMd.lineHeight), color: color.primary },
  subtitle: { fontFamily: font.body, fontSize: ms(12), lineHeight: ms(16), color: color.onSurfaceVariant },
  panel: { backgroundColor: color.surface, borderWidth: ms(4), borderColor: color.border, padding: ms(space[4]), gap: ms(space[4]), boxShadow: shadow.card },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(space[3]),
    borderBottomWidth: ms(4),
    borderColor: color.border,
    paddingBottom: ms(space[3]),
  },
  panelTitle: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(16), color: color.outline, textTransform: 'uppercase' },
  countBadge: { backgroundColor: color.primary, borderWidth: ms(2), borderColor: color.border, paddingHorizontal: ms(space[2]), paddingVertical: ms(space[1]) },
  countText: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(16), color: color.onPrimary, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(space[2]) },
  // Three per row like the web grid: (100% - 2 gaps) / 3.
  hero: {
    width: '31.5%',
    flexGrow: 1,
    maxWidth: '33%',
    alignItems: 'center',
    gap: ms(space[2]),
    padding: ms(space[2]),
    backgroundColor: color.bg,
    borderWidth: ms(4),
    borderColor: color.border,
    boxShadow: shadow.card,
  },
  heroPressed: { backgroundColor: color.surfaceHigh, transform: [{ translateY: 2 }] },
  avatar: { width: ms(48), height: ms(48), borderWidth: ms(2), borderColor: color.border },
  login: { fontFamily: font.bodyBold, fontSize: ms(11), color: color.onSurface, maxWidth: '100%' },
  rankBadge: { alignSelf: 'stretch', borderWidth: ms(2), borderColor: color.border, paddingHorizontal: ms(space[1]), paddingVertical: ms(space[1]) },
  rankText: { fontFamily: font.mono, fontSize: ms(8), lineHeight: ms(10), color: color.border, textAlign: 'center', textTransform: 'uppercase' },
});
