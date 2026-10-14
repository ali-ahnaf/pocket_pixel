import { Tabs } from 'expo-router/js-tabs';
import { BottomNavBar } from '../../components/BottomNavBar';
import { color } from '../../theme';

// Home, Stats, Debts and Profile, matching the web BottomNavBar. Every other web page is a stack route on top.
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <BottomNavBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="debts" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
