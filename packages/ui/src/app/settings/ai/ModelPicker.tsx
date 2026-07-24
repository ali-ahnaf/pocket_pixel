'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/Input';
import type { OpenRouterModel } from '@/lib/ai/openrouter';

/**
 * Curated model ids per documentation/openrouter-ai-migration.md, decision #3
 * ("Show only curated list of models like openai gpt-4o, gpt-5-mini etc").
 * Matched against whatever `listModels()` actually returns via a case-insensitive
 * substring match (in either direction) so minor id drift on OpenRouter's side
 * (e.g. a dated suffix) doesn't silently drop a model from the picker.
 */
const CURATED_MODEL_IDS = ['openai/gpt-4o', 'openai/gpt-4o-mini', 'openai/gpt-5-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash'];

function isCuratedMatch(modelId: string): boolean {
  const lowerId = modelId.toLowerCase();
  return CURATED_MODEL_IDS.some((curatedId) => lowerId.includes(curatedId) || curatedId.includes(lowerId));
}

interface ModelPickerProps {
  models: OpenRouterModel[];
  loading: boolean;
  error: string | null;
  selectedModel: string | null;
  saving: boolean;
  onSelect: (modelId: string) => void;
}

export function ModelPicker({ models, loading, error, selectedModel, saving, onSelect }: ModelPickerProps) {
  const [search, setSearch] = useState('');

  const curatedModels = useMemo(() => models.filter((model) => isCuratedMatch(model.id)), [models]);

  // Best-effort: log (not silently drop) any curated id that matched nothing in
  // the live OpenRouter model list, so drift is visible without breaking the picker.
  useEffect(() => {
    if (models.length === 0) return;
    const unmatched = CURATED_MODEL_IDS.filter((curatedId) => !models.some((model) => model.id.toLowerCase().includes(curatedId) || curatedId.includes(model.id.toLowerCase())));
    if (unmatched.length > 0) {
      console.warn('[ai-settings] Curated model ids not found in OpenRouter listModels() response:', unmatched);
    }
  }, [models]);

  const visibleModels = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return curatedModels;
    return curatedModels.filter((model) => model.id.toLowerCase().includes(query) || model.name.toLowerCase().includes(query));
  }, [curatedModels, search]);

  if (loading) {
    return <p className="text-[12px] text-on-surface-variant">Loading models…</p>;
  }

  if (error) {
    return <p className="font-mono text-label-caps text-error uppercase border-4 border-black bg-surface-container p-3">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
        <Input placeholder="Search curated models…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" autoComplete="off" />
      </div>

      {visibleModels.length === 0 ? (
        <p className="text-[12px] text-on-surface-variant">No curated models match your search.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleModels.map((model) => {
            const isSelected = model.id === selectedModel;
            return (
              <button
                key={model.id}
                type="button"
                disabled={saving}
                onClick={() => onSelect(model.id)}
                className={`flex items-center justify-between gap-3 p-3 border-4 border-black text-left transition-colors active:translate-y-0.5 disabled:opacity-60 ${
                  isSelected ? 'bg-primary text-on-primary' : 'bg-surface hover:bg-surface-container-highest'
                }`}
              >
                <div className="min-w-0">
                  <p className="font-body-sm font-bold truncate">{model.name}</p>
                  <p className="text-[11px] font-mono opacity-80 truncate">{model.id}</p>
                </div>
                {isSelected && <CheckCircle2 className="w-5 h-5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
