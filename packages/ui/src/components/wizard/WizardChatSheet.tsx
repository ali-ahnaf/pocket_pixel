'use client';

import { useEffect, useRef, useState } from 'react';
import { Wand2, X } from 'lucide-react';
import ReactMarkdown, { Components } from 'react-markdown';
import { WIZARD_PROMPT_KEYS, WizardPromptKey } from '@expense-tracker/shared';
import { wizardApi } from '@/lib/api';

interface WizardChatSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

interface ChatMessage {
  id: number;
  role: 'wizard' | 'user';
  text: string;
}

const WIZARD_NAME = 'Aldric the Wise';
const GREETING = 'Greetings, adventurer! I am Aldric the Wise, keeper of thy coin. Choose a query and I shall divine thy fortunes.';

// Player-facing labels for each backend prompt key. Order follows WIZARD_PROMPT_KEYS.
const PROMPT_LABELS: Record<WizardPromptKey, string> = {
  spending_breakdown: '🪄 Where is my gold going?',
  budget_adherence: '📉 Am I on track this month?',
  saving_opportunities: '💰 How can I save more coin?',
  spending_patterns: '📅 What patterns do you see, wizard?',
};

// Markdown element styling tuned to the parchment wizard bubble.
const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-amber-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 last:mb-0 list-disc pl-4 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 last:mb-0 list-decimal pl-4 space-y-1">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  h1: ({ children }) => <h1 className="mb-1 font-semibold text-amber-900">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-1 font-semibold text-amber-900">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1 font-semibold text-amber-900">{children}</h3>,
  code: ({ children }) => <code className="rounded bg-amber-900/10 px-1 py-0.5 font-mono text-[0.85em]">{children}</code>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-amber-900/40 hover:decoration-amber-900">
      {children}
    </a>
  ),
};

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2" aria-label="The wizard is conjuring a response">
      {[0, 150, 300].map((delay) => (
        <span key={delay} className="w-2 h-2 bg-amber-800 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
      ))}
    </div>
  );
}

export function WizardChatSheet({ isOpen, onClose, userId }: WizardChatSheetProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  // Mount/unmount with the slide animation (mirrors the other bottom sheets).
  useEffect(() => {
    if (isOpen) {
      setMessages([{ id: nextId.current++, role: 'wizard', text: GREETING }]);
      setError(null);
      setShouldRender(true);
      const timer = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(timer);
    }
    setIsVisible(false);
    const timer = setTimeout(() => setShouldRender(false), 300);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Keep the latest message in view as the conversation grows.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!shouldRender) return null;

  const askWizard = async (promptKey: WizardPromptKey) => {
    if (isLoading || !userId) return;
    setError(null);
    setMessages((prev) => [...prev, { id: nextId.current++, role: 'user', text: PROMPT_LABELS[promptKey] }]);
    setIsLoading(true);
    try {
      const { message } = await wizardApi.chat(userId, promptKey);
      setMessages((prev) => [...prev, { id: nextId.current++, role: 'wizard', text: message }]);
    } catch {
      setError('The wizard could not conjure a response. Try again, adventurer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Swipe-down-to-close on the sheet handle/header.
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current !== null && e.changedTouches[0].clientY - touchStartY.current > 60) onClose();
    touchStartY.current = null;
  };

  return (
    <>
      {/* Backdrop — tapping outside closes the sheet */}
      <div className={`fixed inset-0 bg-black/70 z-[100] transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      {/* Bottom Sheet */}
      <div
        role="dialog"
        aria-label={`${WIZARD_NAME} chat`}
        className={`fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 z-[110] w-full max-w-md bg-surface-container-high border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)] flex flex-col mt-auto mx-auto h-[90vh] max-h-[90vh] rounded-t-xl transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle (drag target) */}
        <div className="flex justify-center py-2 shrink-0 cursor-grab" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="w-12 h-1.5 bg-black/20 rounded-full" />
        </div>

        {/* Header */}
        <header className="px-6 pt-2 pb-4 shrink-0 border-b-4 border-black/5" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 overflow-hidden bg-primary border-4 border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.2),inset_-2px_-2px_0_rgba(0,0,0,0.4)]">
                {/* eslint-disable-next-line @next/next/no-img-element -- static export, next/image needs an optimizer */}
                <img src="/avatars/wizard_avatar.png" alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="font-headline-md text-primary uppercase leading-tight">{WIZARD_NAME}</h2>
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">Keeper of Coin</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-10 h-10 bg-surface-container-highest border-4 border-black flex items-center justify-center active:translate-y-0.5 active:shadow-none hover:bg-error-container hover:text-on-error-container transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Chat area — parchment / scroll aesthetic */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f3e7c9] text-amber-950">
          {messages.map((msg) =>
            msg.role === 'wizard' ? (
              <div key={msg.id} className="flex items-start gap-2">
                <div className="w-8 h-8 shrink-0 overflow-hidden bg-amber-200 border-2 border-amber-900 rounded-full">
                  <Wand2 className="w-7 h-7" />
                </div>
                <div className="max-w-[80%] bg-[#fbf3df] border-2 border-amber-900/60 rounded-lg rounded-tl-none px-3 py-2 font-body-sm text-body-sm shadow-[2px_2px_0_rgba(120,80,20,0.25)]">
                  <ReactMarkdown components={MARKDOWN_COMPONENTS}>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[80%] bg-primary text-on-primary border-2 border-black rounded-lg rounded-tr-none px-3 py-2 font-body-sm text-body-sm">{msg.text}</div>
              </div>
            ),
          )}

          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 shrink-0 overflow-hidden bg-amber-200 border-2 border-amber-900 rounded-full">
                {/* eslint-disable-next-line @next/next/no-img-element -- static export, next/image needs an optimizer */}
                <Wand2 className="w-7 h-7" />
              </div>
              <div className="bg-[#fbf3df] border-2 border-amber-900/60 rounded-lg rounded-tl-none px-2">
                <TypingIndicator />
              </div>
            </div>
          )}

          {error && <p className="font-body-sm text-error text-center py-1">{error}</p>}
        </div>

        {/* Fixed prompt buttons */}
        <div className="shrink-0 border-t-4 border-black/5 px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {WIZARD_PROMPT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              disabled={isLoading || !userId}
              onClick={() => askWizard(key)}
              className="text-left font-body-sm text-body-sm bg-surface-container text-on-surface border-4 border-black px-3 py-2 shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.4)] hover:bg-surface-container-highest active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {PROMPT_LABELS[key]}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
