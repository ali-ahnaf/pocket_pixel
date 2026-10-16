import { WIZARD_PROMPT_KEYS, type WizardPromptKey } from '@expense-tracker/shared';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { BottomSheetModal } from '../BottomSheetModal';
import { IconText } from '../IconText';
import { PixelIcon, PixelIconName } from '../PixelIcon';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { aiService, logger } from '../../services';
import { color, font, shadow, space, text } from '../../theme';

interface ChatMessage {
  id: number;
  role: 'wizard' | 'user';
  text: string;
}

const WIZARD_NAME = 'Aldric the Wise';
const GREETING = 'Greetings, adventurer! I am Aldric the Wise, keeper of thy coin. Choose a query and I shall divine thy fortunes.';

const PROMPTS: Record<WizardPromptKey, { icon: PixelIconName; label: string }> = {
  spending_breakdown: { icon: 'WandSparkles', label: 'Where is my gold going?' },
  budget_adherence: { icon: 'TrendingDown', label: 'Am I on track this month?' },
  saving_opportunities: { icon: 'MoneyBag', label: 'How can I save more coin?' },
  spending_patterns: { icon: 'Calendar', label: 'What patterns do you see, wizard?' },
};

// Ported from packages/ui/src/components/wizard/WizardChatSheet.tsx. Mount to open; onClose runs after the slide-down.
export function WizardChatSheet({ onClose }: { onClose: () => void }) {
  const { height } = useWindowDimensions();
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 0, role: 'wizard', text: GREETING }]);
  const userId = useLocalUserId();
  const [isLoading, setIsLoading] = useState(false);
  const nextId = useRef(1);
  const scrollRef = useRef<ScrollView>(null);

  const addWizardMessage = (text: string): void => setMessages((prev) => [...prev, { id: nextId.current++, role: 'wizard', text }]);

  const askWizard = async (promptKey: WizardPromptKey): Promise<void> => {
    if (isLoading) return;
    setMessages((prev) => [...prev, { id: nextId.current++, role: 'user', text: PROMPTS[promptKey].label }]);
    setIsLoading(true);

    try {
      const outcome = await aiService.askWizard(userId, promptKey);
      addWizardMessage(outcome.status === 'success' ? outcome.answer : outcome.message);
    } catch (err) {
      logger.error('Wizard chat failed', { err, promptKey });
      addWizardMessage(err instanceof Error ? err.message : 'The wizard could not conjure a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <PixelIcon name="Wizard" size={ms(28)} />
              </View>
              <View>
                <Text style={styles.name} accessibilityRole="header">
                  {WIZARD_NAME}
                </Text>
                <Text style={styles.subtitle}>Keeper of Coin</Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}>
              <PixelIcon name="X" size={ms(20)} />
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
                  <PixelIcon name="WandSparkles" size={ms(24)} />
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
                <PixelIcon name="WandSparkles" size={ms(24)} />
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
                <IconText icon={PROMPTS[key].icon} style={styles.promptText}>
                  {PROMPTS[key].label}
                </IconText>
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
  name: { fontFamily: font.heading, fontSize: ms(18), color: color.primary, textTransform: 'uppercase' },
  subtitle: { fontFamily: font.mono, fontSize: ms(10), color: color.onSurfaceVariant, textTransform: 'uppercase' },
  closeButton: { width: ms(44), height: ms(44), alignItems: 'center', justifyContent: 'center', backgroundColor: color.surfaceHighest, borderWidth: ms(4), borderColor: color.border },
  closePressed: { backgroundColor: color.errorContainer },
  chat: { backgroundColor: color.surfaceLowest, borderWidth: ms(4), borderColor: color.border },
  chatContent: { padding: ms(space[3]), gap: ms(space[3]) },
  wizardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: ms(space[2]) },
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
