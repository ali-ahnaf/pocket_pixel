import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { useUser } from '../hooks/useUser';
import { avatarSource } from '../lib/static';
import { color, font, shadow, gutter, space, text } from '../theme';
import { SheetHeader } from './SheetHeader';
import { SidebarModal } from './SidebarModal';

const MENU: { label: string; glyph: string; href: Href }[] = [
  { label: 'Tabular view', glyph: '▦', href: '/views/table' },
  { label: 'Settings', glyph: '⚙', href: '/settings' },
  { label: 'OpenRouter AI', glyph: '✦', href: '/settings/ai' },
  { label: 'Gmail Integration', glyph: '✉', href: '/settings/google-oauth' },
];

// Ported from packages/ui/src/components/AppBar.tsx and Sidebar.tsx.
export function AppBar() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={[styles.bar, { paddingTop: insets.top + ms(space[2]) }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open menu" hitSlop={4} onPress={() => setMenuOpen(true)} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <Text style={styles.menuGlyph}>☰</Text>
      </Pressable>
      <Text style={styles.title} accessibilityRole="header">
        Pocket Pixel
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Open profile" hitSlop={4} onPress={() => router.navigate('/profile')} style={styles.avatar}>
        <Image source={avatarSource(user?.avatar)} style={styles.avatarImage} accessibilityIgnoresInvertColors />
      </Pressable>

      {menuOpen ? (
        <SidebarModal onClose={() => setMenuOpen(false)}>
          {(close) => (
            <>
              <SheetHeader title="Menu" onClose={close} />
              {MENU.map((item) => (
                <Pressable
                  key={item.label}
                  accessibilityRole="link"
                  onPress={() => {
                    close();
                    router.push(item.href);
                  }}
                  style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                >
                  <Text style={styles.menuItemGlyph}>{item.glyph}</Text>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  close();
                  // Stub: no accounts in the offline app, so this only shows the sign-in screen like the web logout does.
                  router.replace('/signin');
                }}
                style={({ pressed }) => [styles.menuItem, styles.logout, pressed && styles.pressed]}
              >
                <Text style={[styles.menuItemGlyph, styles.logoutText]}>⏻</Text>
                <Text style={[styles.menuItemLabel, styles.logoutText]}>Logout</Text>
              </Pressable>
            </>
          )}
        </SidebarModal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(space[3]),
    paddingHorizontal: ms(gutter),
    paddingBottom: ms(space[2]),
    backgroundColor: color.surface,
    borderBottomWidth: ms(4),
    borderColor: color.border,
  },
  iconButton: { width: ms(44), height: ms(44), alignItems: 'center', justifyContent: 'center', backgroundColor: color.surfaceHigh, borderWidth: ms(4), borderColor: color.border },
  pressed: { transform: [{ translateY: 2 }] },
  menuGlyph: { fontSize: ms(18), color: color.primary },
  title: { flex: 1, textAlign: 'center', fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), color: color.primary, textTransform: 'uppercase' },
  avatar: { width: ms(44), height: ms(44), borderWidth: ms(4), borderColor: color.border, backgroundColor: color.secondaryContainer, boxShadow: shadow.toggleActive, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(space[3]),
    minHeight: ms(52),
    paddingHorizontal: ms(space[3]),
    backgroundColor: color.surfaceLow,
    borderWidth: ms(4),
    borderColor: color.border,
  },
  menuItemPressed: { backgroundColor: color.primary, transform: [{ translateY: 2 }] },
  menuItemGlyph: { width: ms(20), fontSize: ms(16), color: color.onSurface, textAlign: 'center' },
  menuItemLabel: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.onSurface, textTransform: 'uppercase', letterSpacing: 0.8 },
  logout: { backgroundColor: color.errorContainer, marginTop: 'auto' },
  logoutText: { color: color.onErrorContainer },
});
