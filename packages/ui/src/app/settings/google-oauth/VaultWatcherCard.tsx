'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, FlaskConical, Trash2, Vault as VaultIcon } from 'lucide-react';
import type { GmailLabelDto, TagDto, TestParseScriptResultDto, VaultDto, VaultGmailWatcherDto } from '@expense-tracker/shared';
import { Button } from '@/components/Button';
import { Dropdown } from '@/components/Dropdown';
import { profileApi } from '@/lib/api';

/** Prefilled starting point for a new watcher's parse script. */
const DEFAULT_SCRIPT = `// Return a transaction, or null to skip this email.
// email = { from, subject, bodyText, emailDate }
function parse(email) {
  const match = email.bodyText.match(/BDT ([\\d,]+(?:\\.\\d+)?)/);
  if (!match) return null;
  return {
    title: email.subject,
    amount: Number(match[1].replace(/,/g, '')),
    type: 'expense', // or 'income'
    // date: '2026-07-20', // optional yyyy-mm-dd; defaults to today
  };
}`;

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
 * One card per vault: shows its attached Gmail watcher (label + parse script) or
 * an "attach listener" editor. The editor offers a label dropdown, a script
 * textarea, and a sample-email tester that dry-runs the script server-side.
 */
export function VaultWatcherCard({ userId, vault, watcher, labels, tags, onChanged, onError }: VaultWatcherCardProps): JSX.Element {
  const [editing, setEditing] = useState(false);
  const [gmailLabelId, setGmailLabelId] = useState(watcher?.gmailLabelId ?? '');
  const [subjectFilter, setSubjectFilter] = useState(watcher?.subjectFilter ?? '');
  const [tagIds, setTagIds] = useState<string[]>(watcher?.tagIds ?? []);
  const [parseScript, setParseScript] = useState(watcher?.parseScript ?? DEFAULT_SCRIPT);
  const [sampleFrom, setSampleFrom] = useState('');
  const [sampleSubject, setSampleSubject] = useState('');
  const [sampleBody, setSampleBody] = useState('');
  const [testResult, setTestResult] = useState<TestParseScriptResultDto | null>(null);
  const [testing, setTesting] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const startEditing = (): void => {
    setGmailLabelId(watcher?.gmailLabelId ?? '');
    setSubjectFilter(watcher?.subjectFilter ?? '');
    setTagIds(watcher?.tagIds ?? []);
    setParseScript(watcher?.parseScript ?? DEFAULT_SCRIPT);
    setTestResult(null);
    setEditing(true);
  };

  const labelName = (id: string): string => labels.find((label) => label.id === id)?.name ?? watcher?.gmailLabelName ?? id;

  const toggleTag = (id: string): void => setTagIds((prev) => (prev.includes(id) ? prev.filter((tagId) => tagId !== id) : [...prev, id]));

  const handleTest = async (): Promise<void> => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await profileApi.testParseScript(userId, {
        script: parseScript,
        sample: { from: sampleFrom, subject: sampleSubject, bodyText: sampleBody },
      });
      setTestResult(result);
    } catch (err) {
      onError(profileApi.parseError(err));
    } finally {
      setTesting(false);
    }
  };

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
        parseScript,
        tagIds,
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
                ? `Listening on label "${labelName(watcher.gmailLabelId)}"${watcher.subjectFilter ? ` where subject contains "${watcher.subjectFilter}"` : ''} — matching emails create transactions here.`
                : 'No listener attached. Attach a Gmail label + parse script.'}
            </p>
            {watcher && watcher.tagIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {watcher.tagIds.map((tagId) => {
                  const tag = tags.find((t) => t.id === tagId);
                  return (
                    <span key={tagId} className="flex items-center gap-1 border-4 border-black bg-surface-container-high px-2 py-0.5 font-mono text-[11px] uppercase text-on-surface">
                      {tag?.icon && <span>{tag.icon}</span>}
                      {tag?.name ?? tagId}
                    </span>
                  );
                })}
              </div>
            )}
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

            <div className="flex flex-col gap-2">
              <span className="pixel-input-label">Tags (optional)</span>
              {tags.length === 0 ? (
                <span className="text-[11px] text-on-surface-variant">No tags yet — create tags first to attach them here.</span>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const selected = tagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          aria-pressed={selected}
                          className={`flex items-center gap-1 border-4 border-black px-2 py-1 font-mono text-[11px] uppercase transition-colors ${selected ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'}`}
                        >
                          {tag.icon && <span>{tag.icon}</span>}
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[11px] text-on-surface-variant">Selected tags are applied to every transaction this watcher creates.</span>
                </>
              )}
            </div>

            <label className="flex flex-col gap-1">
              <span className="pixel-input-label">Parse script</span>
              <textarea
                value={parseScript}
                onChange={(e) => setParseScript(e.target.value)}
                spellCheck={false}
                rows={12}
                className="pixel-input font-mono text-[12px] leading-relaxed whitespace-pre resize-y"
              />
            </label>

            <div className="border-4 border-black bg-surface-container-high">
              <button type="button" onClick={() => setTestOpen((prev) => !prev)} aria-expanded={testOpen} className="flex w-full items-center justify-between gap-2 p-3 text-left">
                <span className="pixel-input-label">Test against a sample email</span>
                <ChevronDown className={`w-4 h-4 shrink-0 text-on-surface transition-transform ${testOpen ? 'rotate-180' : ''}`} />
              </button>

              {testOpen && (
                <div className="flex flex-col gap-2 border-t-4 border-black p-3">
                  <input value={sampleFrom} onChange={(e) => setSampleFrom(e.target.value)} placeholder="From" className="pixel-input" />
                  <input value={sampleSubject} onChange={(e) => setSampleSubject(e.target.value)} placeholder="Subject" className="pixel-input" />
                  <textarea value={sampleBody} onChange={(e) => setSampleBody(e.target.value)} placeholder="Body text" rows={4} className="pixel-input text-[12px] resize-y" />
                  <Button type="button" variant="secondary" className="w-full py-2" disabled={testing} onClick={handleTest}>
                    <FlaskConical className="w-4 h-4" />
                    {testing ? 'Testing…' : 'Test Script'}
                  </Button>

                  {testResult &&
                    (testResult.ok && testResult.result ? (
                      <div className="font-mono text-[12px] text-primary border-4 border-black bg-surface-container p-2">
                        <p className="uppercase mb-1">Parsed ✓</p>
                        <p>title: {testResult.result.title}</p>
                        <p>amount: {testResult.result.amount}</p>
                        <p>type: {testResult.result.type}</p>
                        <p>date: {testResult.result.date}</p>
                      </div>
                    ) : (
                      <p className="font-mono text-[12px] text-error border-4 border-black bg-surface-container p-2">{testResult.error ?? 'No transaction parsed'}</p>
                    ))}
                </div>
              )}
            </div>

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
    </div>
  );
}
