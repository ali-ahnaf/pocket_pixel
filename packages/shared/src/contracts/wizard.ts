export const WIZARD_PROMPT_KEYS = ['spending_breakdown', 'budget_adherence', 'saving_opportunities', 'spending_patterns'] as const;

export type WizardPromptKey = (typeof WIZARD_PROMPT_KEYS)[number];
