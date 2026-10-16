import { Tabs } from 'expo-router/js-tabs';
import { BottomNavBar } from '../../components/BottomNavBar';
import { WizardChatSheet } from '../../components/stats/WizardChatSheet';
import { useDebtNudgeShare } from '../../hooks/useDebtNudgeShare';
import { useMonthlyRecap } from '../../hooks/useMonthlyRecap';
import { color } from '../../theme';

// Home, Stats, Debts and Profile, matching the web BottomNavBar. Every other web page is a stack route on top.
export default function TabsLayout() {
  const { recap, dismiss } = useMonthlyRecap();
  useDebtNudgeShare();

  return (
    <>
      <Tabs tabBar={(props) => <BottomNavBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.bg } }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="stats" />
        <Tabs.Screen name="debts" />
        <Tabs.Screen name="profile" />
      </Tabs>
      {recap ? <WizardChatSheet intro={recap} onClose={dismiss} /> : null}
    </>
  );
}
