// STUB: OpenRouter key status, save key, model list, model selection and usage. No local data layer for this in packages/app yet, so it uses hardcoded stub data.
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ModelPicker, type OpenRouterModel } from '../../components/settings/ModelPicker';
import { StatusNote } from '../../components/settings/StatusNote';
import { SettingsWindow, settingsStyles } from '../../components/settings/SettingsWindow';
import { UsagePanel, type OpenRouterUsage } from '../../components/settings/UsagePanel';
import { color, font, gutter, space } from '../../theme';

const STUB_HAS_KEY = true;

// The curated ids from the web ModelPicker, standing in for OpenRouter's live model list.
const STUB_MODELS: readonly OpenRouterModel[] = [
  { id: 'openai/gpt-4o', name: 'OpenAI: GPT-4o' },
  { id: 'openai/gpt-4o-mini', name: 'OpenAI: GPT-4o-mini' },
  { id: 'openai/gpt-5-mini', name: 'OpenAI: GPT-5 Mini' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic: Claude 3.5 Sonnet' },
  { id: 'google/gemini-2.0-flash', name: 'Google: Gemini 2.0 Flash' },
];

const STUB_USAGE: OpenRouterUsage = { label: 'sk-or-v1-...stub', keyUsage: 0, keyLimit: null, keyLimitRemaining: null, isFreeTier: false, totalCredits: null, totalUsage: null };

export default function AiSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  // Kept in component state only; nothing is persisted.
  const [selectedModel, setSelectedModel] = useState<string | null>(STUB_MODELS[1].id);

  const handleSaveKey = (): void => {
    if (!apiKeyInput.trim()) {
      setSaveError('Enter your OpenRouter API key.');
      return;
    }
    Alert.alert('Not available yet', 'Saving an OpenRouter key is not supported in the offline app yet.');
  };

  return (
    <ScrollView
      // Safe-area padding is applied by hand below; "automatic" would add the top inset a second time on iOS.
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + ms(space[4]), paddingBottom: insets.bottom + ms(space[8]) }]}
    >
      <BackButton />

      <SettingsWindow icon="Sparkles" title="OpenRouter AI">
        <View style={settingsStyles.section}>
          <Text style={settingsStyles.hint}>
            Bring your own OpenRouter API key to power expense parsing and the wizard. Your key is encrypted on this device before it ever leaves it. Our server only ever stores ciphertext.
          </Text>

          <StatusNote tone={STUB_HAS_KEY ? 'success' : 'muted'} icon={STUB_HAS_KEY ? 'Check' : 'Key'} label={STUB_HAS_KEY ? 'Key saved' : 'No key saved yet'} />

          <Input
            label="OpenRouter API Key"
            secureTextEntry
            value={apiKeyInput}
            placeholder={STUB_HAS_KEY ? '••••••••••••••••' : 'sk-or-...'}
            onChangeText={(value) => {
              setApiKeyInput(value);
              setSaveError(null);
            }}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect={false}
            error={saveError ?? undefined}
          />

          <Text style={styles.warning}>If you reset your password, your saved key cannot be recovered and you&apos;ll need to re-enter it.</Text>

          <Button label="Save Key" variant="primary" size="lg" onPress={handleSaveKey} />
        </View>

        <View style={[settingsStyles.section, settingsStyles.dividerTop]}>
          <Text accessibilityRole="header" style={settingsStyles.sectionTitle}>
            Model
          </Text>
          <Text style={settingsStyles.hint}>Pick which OpenRouter model to use. This choice is not secret and is stored as plain text.</Text>
          <ModelPicker models={STUB_MODELS} loading={false} error={null} selectedModel={selectedModel} saving={false} onSelect={setSelectedModel} />
        </View>

        {STUB_HAS_KEY && (
          <View style={[settingsStyles.section, settingsStyles.dividerTop]}>
            <UsagePanel usage={STUB_USAGE} loading={false} error={null} onRefresh={() => undefined} />
          </View>
        )}
      </SettingsWindow>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: ms(gutter), gap: ms(space[4]) },
  warning: {
    fontFamily: font.mono,
    fontSize: ms(11),
    lineHeight: ms(15),
    color: color.onSurfaceVariant,
    textTransform: 'uppercase',
    borderLeftWidth: ms(4),
    borderColor: color.error,
    paddingLeft: ms(space[3]),
  },
});
