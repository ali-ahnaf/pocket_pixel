import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { Badge } from '../components/Badge';
import { BackButton } from '../components/BackButton';
import { Button } from '../components/Button';
import { Card, Window } from '../components/Card';
import { Dropdown } from '../components/Dropdown';
import { Input } from '../components/Input';
import { PixelLoader } from '../components/PixelLoader';
import { ProgressBar } from '../components/ProgressBar';
import { TransactionTypeToggle } from '../components/TransactionTypeToggle';
import { color, font, space, text } from '../theme';

// Test-only showcase of the shared components.
const VAULTS = ['Groceries', 'Rent', 'Transport', 'Fun'];

export default function ComponentsScreen() {
  const [name, setName] = useState('');
  const [vault, setVault] = useState(VAULTS[0]);
  const [isExpense, setIsExpense] = useState(true);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <BackButton />
      <Text style={styles.title} accessibilityRole="header">
        Components
      </Text>

      <Text style={styles.section}>Button</Text>
      <View style={styles.wrapRow}>
        <Button label="Primary" />
        <Button label="Secondary" variant="secondary" />
        <Button label="Tertiary" variant="tertiary" />
        <Button label="Ghost" variant="ghost" />
        <Button label="Danger" variant="danger" />
        <Button label="Disabled" disabled />
      </View>
      <View style={styles.wrapRow}>
        <Button label="Small" size="sm" />
        <Button label="Medium" size="md" />
        <Button label="Large" size="lg" />
      </View>

      <Text style={styles.section}>Input</Text>
      <Input label="Name" placeholder="Type something" value={name} onChangeText={setName} />
      <Input label="Amount" placeholder="0.00" keyboardType="decimal-pad" error="Amount is required" />

      <Text style={styles.section}>Badge</Text>
      <View style={styles.wrapRow}>
        <Badge label="Primary" variant="primary" />
        <Badge label="Secondary" variant="secondary" />
        <Badge label="Tertiary" variant="tertiary" />
        <Badge label="Error" variant="error" />
        <Badge label="Outline" />
      </View>

      <Text style={styles.section}>ProgressBar</Text>
      <ProgressBar value={30} label="Primary" showValue />
      <ProgressBar value={55} variant="secondary" label="Secondary" showValue />
      <ProgressBar value={80} variant="tertiary" label="Tertiary" showValue />
      <ProgressBar value={120} variant="error" label="Over budget" showValue />

      <Text style={styles.section}>Card</Text>
      <Card title="Card">
        <Text style={styles.body}>Default card content.</Text>
      </Card>
      <Card title="Elevated card" elevated>
        <Text style={styles.body}>Elevated card content.</Text>
      </Card>
      <Window title="Window">
        <Text style={styles.body}>Window body content.</Text>
      </Window>

      <Text style={styles.section}>Dropdown</Text>
      <Dropdown
        accessibilityLabel="Vault"
        options={VAULTS}
        value={vault}
        onChange={setVault}
        keyExtractor={(v) => v}
        renderValue={(v) => <Text style={styles.body}>{v}</Text>}
        renderOption={(v, isSelected) => <Text style={[styles.body, isSelected && styles.selected]}>{v}</Text>}
      />

      <Text style={styles.section}>TransactionTypeToggle</Text>
      <TransactionTypeToggle isExpense={isExpense} onChange={setIsExpense} />

      <Text style={styles.section}>PixelLoader</Text>
      <View style={styles.loaderFrame}>
        <PixelLoader />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: ms(space[6]), gap: ms(space[4]) },
  title: { fontFamily: font.heading, fontSize: ms(text.headlineLg.fontSize), lineHeight: ms(text.headlineLg.lineHeight), color: color.onSurface },
  section: {
    fontFamily: font.mono,
    fontSize: ms(text.labelCaps.fontSize),
    lineHeight: ms(16),
    color: color.primary,
    textTransform: 'uppercase',
    marginTop: ms(space[4]),
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(space[3]) },
  body: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurface },
  selected: { color: color.primary },
  loaderFrame: { height: ms(280), overflow: 'hidden', borderWidth: ms(4), borderColor: color.border },
});
