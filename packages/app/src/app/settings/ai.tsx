import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ModelPicker } from '../../components/settings/ModelPicker';
import { StatusNote } from '../../components/settings/StatusNote';
import { SettingsWindow, settingsStyles } from '../../components/settings/SettingsWindow';
import { UsagePanel } from '../../components/settings/UsagePanel';
import type { OpenRouterModel, OpenRouterUsage } from '../../lib/ai/openrouter';
import { aiService, logger } from '../../services';
import type { AiStatus } from '../../services/ai.service';
import { color, gutter, space } from '../../theme';

const errorMessage = (err: unknown, fallback: string): string => (err instanceof Error ? err.message : fallback);

export default function AiSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<AiStatus | null>(null);

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [modelSaving, setModelSaving] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const [usage, setUsage] = useState<OpenRouterUsage | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageError, setUsageError] = useState<string | null>(null);

  const hasKey = status?.hasKey ?? false;

  useEffect(() => {
    aiService.getStatus().then(setStatus, (err) => logger.error('Load AI status failed', { err }));
  }, []);

  useEffect(() => {
    aiService.listCuratedModels().then(
      (result) => {
        setModels(result);
        setModelsLoading(false);
      },
      (err) => {
        setModelsError(errorMessage(err, 'Failed to load OpenRouter models'));
        setModelsLoading(false);
      },
    );
  }, []);

  // Usage is read straight from OpenRouter with the saved key. Every setState here runs in a promise callback, so it is safe to start from an effect.
  const showUsage = (request: Promise<OpenRouterUsage | null>): void => {
    request
      .then(setUsage, (err) => {
        setUsage(null);
        setUsageError(errorMessage(err, 'Failed to load OpenRouter usage'));
      })
      .finally(() => setUsageLoading(false));
  };

  const refreshUsage = (): void => {
    setUsageError(null);
    setUsageLoading(true);
    showUsage(aiService.getUsage());
  };

  useEffect(() => {
    if (hasKey) showUsage(aiService.getUsage());
  }, [hasKey]);

  const handleSaveKey = async (): Promise<void> => {
    if (!apiKeyInput.trim()) {
      setSaveError('Enter your OpenRouter API key.');
      return;
    }

    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);
    try {
      await aiService.saveApiKey(apiKeyInput);
      setStatus((prev) => ({ selectedModel: prev?.selectedModel ?? null, hasKey: true }));
      setApiKeyInput('');
      setSaveSuccess(true);
      // First save flips hasKey, whose effect loads usage; a replaced key needs an explicit refresh.
      if (hasKey) refreshUsage();
    } catch (err) {
      logger.error('Save OpenRouter key failed', { err });
      setSaveError(errorMessage(err, 'Could not save the key on this device.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSelectModel = async (modelId: string): Promise<void> => {
    setModelError(null);
    setModelSaving(true);
    try {
      await aiService.setModel(modelId);
      setStatus((prev) => ({ hasKey: prev?.hasKey ?? false, selectedModel: modelId }));
    } catch (err) {
      logger.error('Save AI model failed', { err });
      setModelError(errorMessage(err, 'Could not save the model.'));
    } finally {
      setModelSaving(false);
    }
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
            Bring your own OpenRouter API key to power expense parsing. Your key is kept in this phone&apos;s secure storage (Keychain on iOS, Keystore on Android) and is only ever sent to OpenRouter.
          </Text>

          {status && <StatusNote tone={hasKey ? 'success' : 'muted'} icon={hasKey ? 'Check' : 'Key'} label={hasKey ? 'Key saved' : 'No key saved yet'} />}

          <Input
            label="OpenRouter API Key"
            secureTextEntry
            value={apiKeyInput}
            placeholder={hasKey ? '••••••••••••••••' : 'sk-or-...'}
            onChangeText={(value) => {
              setApiKeyInput(value);
              setSaveError(null);
              setSaveSuccess(false);
            }}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect={false}
            error={saveError ?? undefined}
          />

          {saveSuccess && <StatusNote tone="success" icon="Check" label="OpenRouter key saved" />}

          <Button label={saving ? 'Saving…' : 'Save Key'} variant="primary" size="lg" disabled={saving} onPress={handleSaveKey} />
        </View>

        <View style={[settingsStyles.section, settingsStyles.dividerTop]}>
          <Text accessibilityRole="header" style={settingsStyles.sectionTitle}>
            Model
          </Text>
          <Text style={settingsStyles.hint}>Pick which OpenRouter model to use. This choice is not secret.</Text>
          {modelError && <StatusNote tone="error" label={modelError} />}
          <ModelPicker models={models} loading={modelsLoading} error={modelsError} selectedModel={status?.selectedModel ?? null} saving={modelSaving} onSelect={handleSelectModel} />
        </View>

        {hasKey && (
          <View style={[settingsStyles.section, settingsStyles.dividerTop]}>
            <UsagePanel usage={usage} loading={usageLoading} error={usageError} onRefresh={refreshUsage} />
          </View>
        )}
      </SettingsWindow>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: ms(gutter), gap: ms(space[4]) },
});
