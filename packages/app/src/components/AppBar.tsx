import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { useAuth } from '../hooks/AuthProvider';
import { useUser } from '../hooks/useUser';
import { avatarSource } from '../lib/static';
import { color, font, shadow, gutter, space, text } from '../theme';
import { PixelIcon, PixelIconName } from './PixelIcon';
import { SheetHeader } from './SheetHeader';
import { SidebarModal } from './SidebarModal';

const MENU: { label: string; icon: PixelIconName; href: Href }[] = [
  { label: 'Tabular view', icon: 'ChartColumn', href: '/views/table' },
  { label: 'Adventures', icon: 'Compass', href: '/adventures' },
  { label: 'Settings', icon: 'Settings', href: '/settings' },
  { label: 'OpenRouter AI', icon: 'Sparkles', href: '/settings/ai' },
  { label: 'Gmail', icon: 'Mail', href: '/settings/google-oauth' },
];

// Ported from packages/ui/src/components/AppBar.tsx and Sidebar.tsx.
export function AppBar() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={[styles.bar, { paddingTop: insets.top + ms(space[2]) }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open menu" hitSlop={4} onPress={() => setMenuOpen(true)} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <PixelIcon name="Menu" size={ms(24)} />
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
                  <PixelIcon name={item.icon} size={ms(20)} />
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  close();
                  // Clearing the session flips the root layout's route guard, which moves the user to the sign-in screen.
                  signOut();
                }}
                style={({ pressed }) => [styles.menuItem, styles.logout, pressed && styles.pressed]}
              >
                <PixelIcon name="Lock" size={ms(20)} />
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
  menuItemLabel: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.onSurface, textTransform: 'uppercase', letterSpacing: 0.8 },
  logout: { backgroundColor: color.errorContainer, marginTop: 'auto' },
  logoutText: { color: color.onErrorContainer },
});
