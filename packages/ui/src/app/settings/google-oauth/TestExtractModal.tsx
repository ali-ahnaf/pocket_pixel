'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, FlaskConical, CheckCircle2, XCircle } from 'lucide-react';
import type { AiExtractResultDto, TagDto } from '@expense-tracker/shared';
import { Button } from '@/components/Button';
import { profileApi } from '@/lib/api';
import { iconMapper } from '@/lib/iconMapper';
import { useDekSession } from '@/hooks/useDekSession';
import { decryptKey } from '@/lib/crypto/ai-key';
import { extractTransactionFromEmail, toAiExtractResult } from '@/lib/ai/gmail-extractor';

interface TestExtractModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  guidanceHint: string;
  tags: TagDto[];
}

/**
 * Dry-run preview: paste a sample email and see what the AI extractor would
 * resolve it to (amount/title/type/tags), without saving a watcher or creating
 * a transaction.
 */
export function TestExtractModal({ isOpen, onClose, userId, guidanceHint, tags }: TestExtractModalProps): JSX.Element | null {
  const { dek, loading: dekLoading } = useDekSession();
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<AiExtractResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAiSetup, setNeedsAiSetup] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFrom('');
      setSubject('');
      setBodyText('');
      setResult(null);
      setError(null);
      setNeedsAiSetup(false);
      setShouldRender(true);
      const t = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(t);
    } else {
      setIsVisible(false);
      const t = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const canTest = bodyText.trim().length > 0;

  /**
   * Runs the same client-side extractor as the pending-expense flow
   * (`lib/ai/gmail-extractor.ts`) against the pasted sample, using the user's
   * own E2E-encrypted OpenRouter key. No server round-trip — see
   * documentation/openrouter-ai-migration.md (T12).
   */
  const handleTest = async (): Promise<void> => {
    if (!canTest) return;
    setTesting(true);
    setError(null);
    setResult(null);
    setNeedsAiSetup(false);
    try {
      if (dekLoading) {
        throw new Error('Still unlocking your encryption key — try again in a moment.');
      }
      if (!dek) {
        throw new Error('Your encryption key is not unlocked in this session. Please log out and log back in to unlock it, then try again.');
      }

      const status = await profileApi.getAiCredentialStatus(userId);
      if (!status.hasKey || !status.keyCiphertext || !status.keyIv) {
        setNeedsAiSetup(true);
        throw new Error('Set up your OpenRouter API key in Settings before testing.');
      }
      if (!status.selectedModel) {
        setNeedsAiSetup(true);
        throw new Error('Pick an OpenRouter model in Settings before testing.');
      }

      const apiKey = await decryptKey(status.keyCiphertext, status.keyIv, dek);
      const parsed = await extractTransactionFromEmail({
        apiKey,
        model: status.selectedModel,
        email: { from: from.trim(), subject: subject.trim(), bodyText, emailDate: null },
        tags: tags.map((tag) => ({ id: tag.id, name: tag.name })),
        guidanceHint: guidanceHint.trim() || undefined,
      });
      setResult(toAiExtractResult(parsed));
    } catch (err) {
      setError(err instanceof Error ? err.message : profileApi.parseError(err));
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/70 z-[100] transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

      <div
        className={`fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 z-[110] w-full max-w-md bg-surface-container-high border-4 border-black shadow-[inset_2px_2px_0px_rgba(255,255,255,0.1),_inset_-2px_-2px_0px_rgba(0,0,0,0.4)] flex flex-col mt-auto mx-auto max-h-[90vh] overflow-y-auto rounded-t-xl transition-transform duration-300 ease-in-out custom-scrollbar ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-center py-2 shrink-0">
          <div className="w-12 h-1.5 bg-black/20 rounded-full" />
        </div>

        <header className="px-6 pt-2 pb-4 shrink-0 border-b-4 border-black/5">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-md text-primary uppercase flex items-center gap-2">
              <FlaskConical className="w-6 h-6" />
              Test On Sample Email
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-surface-container-highest border-4 border-black flex items-center justify-center active:translate-y-0.5 hover:bg-error-container hover:text-on-error-container transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        <main className="px-6 py-6 pt-0 space-y-5 overflow-y-auto">
          <p className="text-[12px] text-on-surface-variant mt-4">Paste a sample email below to preview what the AI would extract, without saving anything.</p>

          <div className="space-y-2">
            <label className="pixel-input-label ml-1">From (optional)</label>
            <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="alerts@bank.com" className="pixel-input" />
          </div>

          <div className="space-y-2">
            <label className="pixel-input-label ml-1">Subject (optional)</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Debit Alert" className="pixel-input" />
          </div>

          <div className="space-y-2">
            <label className="pixel-input-label ml-1">Body</label>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Paste the full email body text here…"
              spellCheck={false}
              rows={8}
              className="pixel-input font-mono text-[12px] leading-relaxed whitespace-pre-wrap resize-y"
            />
          </div>

          {error && (
            <div className="border-4 border-black bg-surface-container p-3 space-y-2">
              <p className="font-mono text-label-caps text-error uppercase">{error}</p>
              {needsAiSetup && (
                <Link href="/settings/ai" onClick={onClose} className="inline-block font-label-caps text-primary underline underline-offset-2">
                  GO TO SETTINGS
                </Link>
              )}
            </div>
          )}

          {result && (
            <div className="border-4 border-black bg-surface-container p-4 flex flex-col gap-2">
              {result.matched ? (
                <>
                  <span className="flex items-center gap-2 font-mono text-label-caps text-primary uppercase">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Matched a transaction
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-on-surface">
                    <span className="text-on-surface-variant">Title</span>
                    <span className="text-right">{result.title}</span>
                    <span className="text-on-surface-variant">Amount</span>
                    <span className="text-right">{result.amount}</span>
                    <span className="text-on-surface-variant">Type</span>
                    <span className="text-right capitalize">{result.type}</span>
                  </div>
                  {result.tagIds && result.tagIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {result.tagIds.map((tagId) => {
                        const tag = tags.find((t) => t.id === tagId);
                        const TagIcon = iconMapper(tag?.icon || 'Hash');
                        return (
                          <span key={tagId} className="flex items-center gap-1 border-4 border-black bg-surface-container-high px-2 py-0.5 font-mono text-[11px] uppercase text-on-surface">
                            <TagIcon size={12} strokeWidth={3} />
                            {tag?.name ?? tagId}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <span className="flex items-center gap-2 font-mono text-label-caps text-on-surface-variant uppercase">
                  <XCircle className="w-4 h-4 shrink-0" />
                  Not a transaction — this email would be skipped
                </span>
              )}
            </div>
          )}

          <div className="pt-2">
            <Button variant="primary" className="w-full py-3 flex items-center justify-center gap-2 group disabled:opacity-50" onClick={handleTest} disabled={!canTest || testing}>
              <FlaskConical className="w-5 h-5 group-active:scale-90 transition-transform" />
              <span className="font-headline-sm uppercase tracking-wider">{testing ? 'Testing…' : 'Run Test'}</span>
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}
