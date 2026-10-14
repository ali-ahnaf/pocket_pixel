// STUB: wizard answers (OpenRouter AI with the user's encrypted API key). No local data layer for this in packages/app yet, so it uses hardcoded stub data.
import { WIZARD_PROMPT_KEYS, type WizardPromptKey } from '@expense-tracker/shared';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { BottomSheetModal } from '../BottomSheetModal';
import { color, font, shadow, space, text } from '../../theme';

interface ChatMessage {
  id: number;
  role: 'wizard' | 'user';
  text: string;
}

const WIZARD_NAME = 'Aldric the Wise';
const GREETING = 'Greetings, adventurer! I am Aldric the Wise, keeper of thy coin. Choose a query and I shall divine thy fortunes.';

const PROMPT_LABELS: Record<WizardPromptKey, string> = {
  spending_breakdown: '🪄 Where is my gold going?',
  budget_adherence: '📉 Am I on track this month?',
  saving_opportunities: '💰 How can I save more coin?',
  spending_patterns: '📅 What patterns do you see, wizard?',
};

const STUB_ANSWERS: Record<WizardPromptKey, string> = {
  spending_breakdown: 'My crystal ball is still being forged for this realm. Once it is ready, I shall show thee which tags and vaults drink the most gold.',
  budget_adherence: 'The budget runes cannot yet be read on this device. Soon I shall weigh thy spending against each vault budget.',
  saving_opportunities: 'Patience, adventurer. When my spellbook arrives here, I shall point out the coin thou couldst keep.',
  spending_patterns: 'The patterns are hidden from me for now. In time I shall reveal the days and habits where thy gold slips away.',
};

// Ported from packages/ui/src/components/wizard/WizardChatSheet.tsx. Mount to open; onClose runs after the slide-down.
export function WizardChatSheet({ onClose }: { onClose: () => void }) {
  const { height } = useWindowDimensions();
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 0, role: 'wizard', text: GREETING }]);
  const [isLoading, setIsLoading] = useState(false);
  const nextId = useRef(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const askWizard = (promptKey: WizardPromptKey): void => {
    if (isLoading) return;
    setMessages((prev) => [...prev, { id: nextId.current++, role: 'user', text: PROMPT_LABELS[promptKey] }]);
    setIsLoading(true);
    timer.current = setTimeout(() => {
      setMessages((prev) => [...prev, { id: nextId.current++, role: 'wizard', text: STUB_ANSWERS[promptKey] }]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarGlyph}>🧙</Text>
              </View>
              <View>
                <Text style={styles.name} accessibilityRole="header">
                  {WIZARD_NAME}
                </Text>
                <Text style={styles.subtitle}>Keeper of Coin</Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}>
              <Text style={styles.closeGlyph}>✕</Text>
            </Pressable>
          </View>

          {/* Fixed height so the sheet never resizes while it slides in or as messages arrive. */}
          <ScrollView
            ref={scrollRef}
            style={[styles.chat, { height: height * 0.45 }]}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) =>
              msg.role === 'wizard' ? (
                <View key={msg.id} style={styles.wizardRow}>
                  <Text style={styles.wizardIcon}>🪄</Text>
                  <View style={[styles.bubble, styles.wizardBubble]}>
                    <Text style={styles.wizardText}>{msg.text}</Text>
                  </View>
                </View>
              ) : (
                <View key={msg.id} style={[styles.bubble, styles.userBubble]}>
                  <Text style={styles.userText}>{msg.text}</Text>
                </View>
              ),
            )}
            {isLoading && (
              <View style={styles.wizardRow} accessibilityLabel="The wizard is conjuring a response">
                <Text style={styles.wizardIcon}>🪄</Text>
                <View style={[styles.bubble, styles.wizardBubble]}>
                  <Text style={styles.wizardText}>• • •</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.prompts}>
            {WIZARD_PROMPT_KEYS.map((key) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityState={{ disabled: isLoading }}
                disabled={isLoading}
                onPress={() => askWizard(key)}
                style={({ pressed }) => [styles.prompt, pressed && styles.promptPressed, isLoading && styles.disabled]}
              >
                <Text style={styles.promptText}>{PROMPT_LABELS[key]}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </BottomSheetModal>
  );
}

const bodySm = { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight) };

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: ms(space[3]) },
  avatar: { width: ms(44), height: ms(44), alignItems: 'center', justifyContent: 'center', backgroundColor: color.primary, borderWidth: ms(4), borderColor: color.border, boxShadow: shadow.card },
  avatarGlyph: { fontSize: ms(22) },
  name: { fontFamily: font.heading, fontSize: ms(18), color: color.primary, textTransform: 'uppercase' },
  subtitle: { fontFamily: font.mono, fontSize: ms(10), color: color.onSurfaceVariant, textTransform: 'uppercase' },
  closeButton: { width: ms(44), height: ms(44), alignItems: 'center', justifyContent: 'center', backgroundColor: color.surfaceHighest, borderWidth: ms(4), borderColor: color.border },
  closePressed: { backgroundColor: color.errorContainer },
  closeGlyph: { fontSize: ms(18), color: color.onSurface },
  chat: { backgroundColor: color.surfaceLowest, borderWidth: ms(4), borderColor: color.border },
  chatContent: { padding: ms(space[3]), gap: ms(space[3]) },
  wizardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: ms(space[2]) },
  wizardIcon: { fontSize: ms(20) },
  bubble: { maxWidth: '80%', paddingHorizontal: ms(space[3]), paddingVertical: ms(space[2]), borderWidth: 2 },
  wizardBubble: { backgroundColor: color.surfaceHigh, borderColor: color.secondary },
  wizardText: { ...bodySm, color: color.onSurface },
  userBubble: { alignSelf: 'flex-end', backgroundColor: color.primary, borderColor: color.border },
  userText: { ...bodySm, color: color.onPrimary },
  prompts: { gap: ms(space[2]) },
  prompt: {
    minHeight: ms(44),
    justifyContent: 'center',
    paddingHorizontal: ms(space[3]),
    paddingVertical: ms(space[2]),
    backgroundColor: color.surface,
    borderWidth: ms(4),
    borderColor: color.border,
    boxShadow: shadow.card,
  },
  promptPressed: { backgroundColor: color.surfaceHighest, transform: [{ translateY: 2 }] },
  disabled: { opacity: 0.5 },
  promptText: { ...bodySm, color: color.onSurface },
});
