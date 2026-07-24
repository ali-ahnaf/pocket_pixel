/**
 * Client-side port of the Wizard chat, formerly `packages/api/src/services/wizard.service.ts`.
 * Runs entirely in the browser now: the persona + per-prompt-key data
 * aggregation are ported verbatim/adapted here, and the OpenAI call is
 * replaced with the user's own OpenRouter key via `chat()`. Nothing is sent
 * to our API — see documentation/openrouter-ai-migration.md (T10).
 */

import type { TransactionDto, VaultDto, WizardPromptKey } from '@expense-tracker/shared';
import { chat } from './openrouter';

// Seed personality handed to the model as the system message (kept under 120 words).
export const WIZARD_PERSONA = `You are Aldric the Wise, an ancient and benevolent wizard who guides adventurers through the realm of their finances. Speak in character: warm, encouraging, and a touch dramatic, never dull. Call money "gold", budgets "treasure coffers", spending categories "guilds", and savings goals "quests". You will receive the adventurer's real financial data as JSON, along with the task to perform. Read it carefully, then answer the implied question in 2-4 short sentences, citing concrete numbers from the data as gold. Never invent figures that are not present. Keep your counsel under 120 words and close on an encouraging note.`;

// The task instruction paired with the data for each prompt key.
export const TASKS: Record<WizardPromptKey, string> = {
  spending_breakdown: 'Summarize where the adventurer spends most this month, based on their top spending guilds.',
  budget_adherence: 'For each treasure coffer, tell the adventurer whether they are on track or overspending against its budget.',
  saving_opportunities: 'Look at the guilds where the adventurer consistently spends a lot and suggest 2-3 concrete ways to save gold.',
  spending_patterns: 'Describe month-over-month trends and call out any notable anomalies across the adventurer’s guilds over the last three months.',
};

interface CategoryTotal {
  category: string;
  total: number;
}

interface VaultBudgetStatus {
  vault: string;
  budget: number;
  spent: number;
}

interface MonthlyCategoryTotals {
  month: string;
  categories: CategoryTotal[];
}

interface WizardPayload {
  task: string;
  data: unknown;
}

interface MonthKey {
  month: number;
  year: number;
  label: string;
}

/**
 * Sum expense amounts per tag name. Tags are the app's spending categories;
 * an expense with multiple tags counts toward each. Income rows and untagged
 * spend are handled explicitly. Adapted from the server's `sumByTag`, which
 * read tag names off `Expense.transactionTags[].tag.name` — the UI's
 * `TransactionDto` already carries `tags: TagDto[]` directly (see
 * `packages/shared/src/contracts/transactions.ts`), so this reads `tags[].name`.
 */
function sumByTag(transactions: TransactionDto[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== 'expense') continue;
    const amount = Number(transaction.amount);
    const tags = transaction.tags ?? [];
    if (tags.length === 0) {
      totals.set('Untagged', (totals.get('Untagged') ?? 0) + amount);
      continue;
    }
    for (const tag of tags) {
      const name = tag.name ?? 'Untagged';
      totals.set(name, (totals.get(name) ?? 0) + amount);
    }
  }
  return totals;
}

function toSortedTotals(totals: Map<string, number>): CategoryTotal[] {
  return [...totals.entries()].map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);
}

function label(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

function currentMonth(): MonthKey {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear(), label: label(now) };
}

function lastMonths(count: number): MonthKey[] {
  const now = new Date();
  const months: MonthKey[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({ month: date.getMonth() + 1, year: date.getFullYear(), label: label(date) });
  }
  return months;
}

/**
 * Filters transactions to a given calendar month using the ISO `date` string
 * (`YYYY-MM-DD`) directly, matching the stats page's own month-key convention
 * (`getMonthKey` in `stats/page.tsx`), rather than `new Date(...)` parsing.
 * Replaces the server's `TransactionsRepository.findManyForUser({ month, year })`
 * query — here we filter whatever `transactions` array the caller already has
 * in memory instead of issuing a new query per month.
 */
function filterByMonth(transactions: TransactionDto[], month: number, year: number): TransactionDto[] {
  return transactions.filter((transaction) => {
    const [transactionYear, transactionMonth] = transaction.date.split('-').map(Number);
    return transactionYear === year && transactionMonth === month;
  });
}

// Top 5 spending guilds (tags) for the current month.
function spendingBreakdown(transactions: TransactionDto[]): { month: string; topCategories: CategoryTotal[] } {
  const { month, year, label: monthLabel } = currentMonth();
  const topCategories = toSortedTotals(sumByTag(filterByMonth(transactions, month, year))).slice(0, 5);
  return { month: monthLabel, topCategories };
}

// Budget vs actual spend per vault (treasure coffer) for the current month.
function budgetAdherence(transactions: TransactionDto[], vaults: VaultDto[]): { month: string; coffers: VaultBudgetStatus[] } {
  const { month, year, label: monthLabel } = currentMonth();
  const scoped = filterByMonth(transactions, month, year);

  const spentByVault = new Map<string, number>();
  for (const transaction of scoped) {
    if (transaction.type !== 'expense' || !transaction.vaultId) continue;
    spentByVault.set(transaction.vaultId, (spentByVault.get(transaction.vaultId) ?? 0) + Number(transaction.amount));
  }

  const coffers = vaults.filter((vault) => vault.monthlyBudget != null).map((vault) => ({ vault: vault.name, budget: Number(vault.monthlyBudget), spent: spentByVault.get(vault.id) ?? 0 }));

  return { month: monthLabel, coffers };
}

// Guilds with the highest total spend across the last 3 months.
function savingOpportunities(transactions: TransactionDto[]): { monthsConsidered: number; topCategories: CategoryTotal[] } {
  const months = lastMonths(3);
  const scoped = months.flatMap((m) => filterByMonth(transactions, m.month, m.year));
  const topCategories = toSortedTotals(sumByTag(scoped)).slice(0, 5);
  return { monthsConsidered: months.length, topCategories };
}

// Month-over-month guild totals for the last 3 months.
function spendingPatterns(transactions: TransactionDto[]): MonthlyCategoryTotals[] {
  const months = lastMonths(3);
  return months.map((m) => ({ month: m.label, categories: toSortedTotals(sumByTag(filterByMonth(transactions, m.month, m.year))) }));
}

function buildPayload(promptKey: WizardPromptKey, transactions: TransactionDto[], vaults: VaultDto[]): WizardPayload {
  const task = TASKS[promptKey];
  switch (promptKey) {
    case 'spending_breakdown':
      return { task, data: spendingBreakdown(transactions) };
    case 'budget_adherence':
      return { task, data: budgetAdherence(transactions, vaults) };
    case 'saving_opportunities':
      return { task, data: savingOpportunities(transactions) };
    case 'spending_patterns':
      return { task, data: spendingPatterns(transactions) };
    default: {
      const exhaustiveCheck: never = promptKey;
      throw new Error(`Unknown wizard prompt key: ${String(exhaustiveCheck)}`);
    }
  }
}

/**
 * Builds the wizard payload for `promptKey` from the given transactions/vaults,
 * sends it to OpenRouter with the wizard persona as the system message, and
 * returns the trimmed reply. Throws if OpenRouter returns no usable message,
 * mirroring the server's `AppError('The wizard could not conjure a response', 502)`.
 */
export async function getWizardResponse(promptKey: WizardPromptKey, transactions: TransactionDto[], vaults: VaultDto[], apiKey: string, model: string): Promise<string> {
  const payload = buildPayload(promptKey, transactions, vaults);

  const message = await chat({
    apiKey,
    model,
    messages: [
      { role: 'system', content: WIZARD_PERSONA },
      { role: 'user', content: JSON.stringify(payload) },
    ],
  });

  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('The wizard could not conjure a response');
  }

  return trimmed;
}
