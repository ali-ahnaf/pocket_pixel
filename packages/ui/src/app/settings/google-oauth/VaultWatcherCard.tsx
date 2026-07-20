'use client';

import { useState } from 'react';
import { CheckCircle2, FlaskConical, Trash2, Vault as VaultIcon } from 'lucide-react';
import type { GmailLabelDto, TagDto, VaultDto, VaultGmailWatcherDto } from '@expense-tracker/shared';
import { Button } from '@/components/Button';
import { Dropdown } from '@/components/Dropdown';
import { profileApi } from '@/lib/api';
import { TestExtractModal } from './TestExtractModal';

interface VaultWatcherCardProps {
  userId: string;
  vault: VaultDto;
  watcher?: VaultGmailWatcherDto;
  labels: GmailLabelDto[];
  tags: TagDto[];
  onChanged: () => void;
  onError: (message: string) => void;
}

/**
 * One card per vault: shows its attached Gmail watcher (label + AI extraction
 * guidance) or an "attach listener" editor. The editor offers a label dropdown,
 * an optional subject filter, an optional free-text guidance hint for the AI
 * extractor, and a dry-run preview against a pasted sample email.
 */
export function VaultWatcherCard({ userId, vault, watcher, labels, tags, onChanged, onError }: VaultWatcherCardProps): JSX.Element {
  const [editing, setEditing] = useState(false);
  const [gmailLabelId, setGmailLabelId] = useState(watcher?.gmailLabelId ?? '');
  const [subjectFilter, setSubjectFilter] = useState(watcher?.subjectFilter ?? '');
  const [guidanceHint, setGuidanceHint] = useState(watcher?.guidanceHint ?? '');
  const [saving, setSaving] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);

  const startEditing = (): void => {
    setGmailLabelId(watcher?.gmailLabelId ?? '');
    setSubjectFilter(watcher?.subjectFilter ?? '');
    setGuidanceHint(watcher?.guidanceHint ?? '');
    setEditing(true);
  };

  const labelName = (id: string): string => labels.find((label) => label.id === id)?.name ?? watcher?.gmailLabelName ?? id;

  const handleSave = async (): Promise<void> => {
    if (!gmailLabelId) {
      onError('Pick a Gmail label to attach to this vault');
      return;
    }
    setSaving(true);
    try {
      await profileApi.setVaultWatcher(userId, vault.id, {
        gmailLabelId,
        gmailLabelName: labels.find((label) => label.id === gmailLabelId)?.name,
        subjectFilter: subjectFilter.trim() || undefined,
        guidanceHint: guidanceHint.trim() || undefined,
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      onError(profileApi.parseError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    setSaving(true);
    try {
      await profileApi.deleteVaultWatcher(userId, vault.id);
      setEditing(false);
      onChanged();
    } catch (err) {
      onError(profileApi.parseError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-4 border-black bg-surface-container">
      <div className="flex items-center justify-between gap-2 border-b-4 border-black bg-surface-container-high px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <VaultIcon className="w-4 h-4 text-primary shrink-0" />
          <span className="font-label-caps uppercase tracking-wider text-on-surface truncate">{vault.name}</span>
        </div>
        {watcher && !editing && (
          <span className="flex items-center gap-1 font-mono text-[11px] uppercase text-primary shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {labelName(watcher.gmailLabelId)}
          </span>
        )}
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {!editing ? (
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-on-surface-variant">
              {watcher
                ? `Listening on label "${labelName(watcher.gmailLabelId)}"${watcher.subjectFilter ? ` where subject contains "${watcher.subjectFilter}"` : ''} — AI reads the email and fills in the transaction.`
                : 'No listener attached. Attach a Gmail label and let AI fill in the transaction.'}
            </p>
            {watcher?.guidanceHint && <p className="border-4 border-black bg-surface-container-high px-3 py-2 font-mono text-[11px] text-on-surface-variant">Guidance: {watcher.guidanceHint}</p>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="primary" className="w-full py-2" onClick={startEditing}>
                {watcher ? 'Edit Listener' : 'Attach Listener'}
              </Button>
              {watcher && (
                <Button type="button" variant="danger" className="w-full py-2" disabled={saving} onClick={handleRemove}>
                  <Trash2 className="w-4 h-4" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="pixel-input-label">Gmail label</span>
              <Dropdown
                options={labels}
                value={labels.find((label) => label.id === gmailLabelId) ?? null}
                onChange={(label) => setGmailLabelId(label?.id ?? '')}
                keyExtractor={(label) => label?.id ?? ''}
                renderValue={(label) => <span className={`text-sm ${label ? 'text-on-surface' : 'text-on-surface-variant'}`}>{label ? label.name : 'Select a label…'}</span>}
                renderOption={(label) => <span className="text-sm">{label?.name}</span>}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="pixel-input-label">Subject filter (optional)</span>
              <input value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} placeholder="e.g. Debit Alert — leave blank to match any subject" className="pixel-input" />
              <span className="text-[11px] text-on-surface-variant">Case-insensitive substring. Only emails whose subject contains this fire this vault.</span>
            </label>

            <label className="flex flex-col gap-1">
              <span className="pixel-input-label">Guidance for AI (optional)</span>
              <textarea
                value={guidanceHint}
                onChange={(e) => setGuidanceHint(e.target.value)}
                placeholder="e.g. these are always groceries, ignore reward-point emails"
                spellCheck={false}
                rows={4}
                className="pixel-input font-mono text-[12px] leading-relaxed resize-y"
              />
              <span className="text-[11px] text-on-surface-variant">AI reads the email and fills in the transaction (amount, title, type, tags). This nudge is appended to its prompt.</span>
            </label>

            <Button type="button" variant="secondary" className="w-full py-2" onClick={() => setTestModalOpen(true)}>
              <FlaskConical className="w-4 h-4" />
              Test On A Pasted Email
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="primary" className="w-full py-2" disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : 'Save Listener'}
              </Button>
              <Button type="button" variant="ghost" className="w-full py-2" disabled={saving} onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <TestExtractModal isOpen={testModalOpen} onClose={() => setTestModalOpen(false)} userId={userId} guidanceHint={guidanceHint} tags={tags} />
    </div>
  );
}
