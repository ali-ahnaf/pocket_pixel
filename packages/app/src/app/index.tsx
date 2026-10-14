import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { ms } from 'react-native-size-matters';
import { Button } from '../components/Button';
import { useHomeSummary } from '../hooks/useHomeSummary';
import { color, font, space, text } from '../theme';

export default function Home() {
  const { name, transactionCount, monthIncome, monthExpense } = useHomeSummary();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        {name}
      </Text>
      <Text style={styles.stat}>{transactionCount} transactions</Text>
      <Text style={styles.stat}>Income this month: {monthIncome.toFixed(2)}</Text>
      <Text style={styles.stat}>Expense this month: {monthExpense.toFixed(2)}</Text>
      <Button label="Components" variant="ghost" onPress={() => router.push('/components')} style={styles.link} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', padding: ms(space[6]) },
  link: { marginTop: ms(space[6]), alignSelf: 'flex-start' },
  stat: { fontFamily: font.body, fontSize: ms(text.bodyLg.fontSize), lineHeight: ms(text.bodyLg.lineHeight), color: color.onSurface },
  title: { fontFamily: font.heading, fontSize: ms(text.headlineLg.fontSize), lineHeight: ms(text.headlineLg.lineHeight), color: color.onSurface },
});
