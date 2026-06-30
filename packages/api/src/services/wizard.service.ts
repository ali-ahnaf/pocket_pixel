import OpenAI from 'openai';
import { WizardChatResponse, WizardPromptKey } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import { Expense } from '../entities/Expense.entity';
import { TransactionsRepository } from '../repositories/transactions.repository';
import { VaultsRepository } from '../repositories/vaults.repository';
import { transactionsRepository, vaultsRepository } from '../repositories';

export const WIZARD_MODEL = 'gpt-4o-mini';

// Seed personality handed to the model as `instructions` (kept under 120 words).
const WIZARD_PERSONA = `You are Aldric the Wise, an ancient and benevolent wizard who guides adventurers through the realm of their finances. Speak in character: warm, encouraging, and a touch dramatic, never dull. Call money "gold", budgets "treasure coffers", spending categories "guilds", and savings goals "quests". You will receive the adventurer's real financial data as JSON, along with the task to perform. Read it carefully, then answer the implied question in 2-4 short sentences, citing concrete numbers from the data as gold. Never invent figures that are not present. Keep your counsel under 120 words and close on an encouraging note.`;

// The task instruction paired with the data for each prompt key.
const TASKS: Record<WizardPromptKey, string> = {
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

/**
 * Powers the Wizard NPC chat. Fetches the adventurer's real spending data at
 * request time, wraps it in a wizard persona, and asks OpenAI to narrate it.
 * Nothing is persisted. The OpenAI client is created lazily so the server can
 * boot without the key set, and the repositories are injected (defaulting to
 * the shared singletons) so the service is unit-testable with mocks.
 */
export class WizardService {
  private client: OpenAI | null = null;

  constructor(
    private readonly transactions: TransactionsRepository = transactionsRepository,
    private readonly vaults: VaultsRepository = vaultsRepository,
  ) {}

  // The SDK reads OPENAI_API_KEY from the environment automatically.
  private openai(): OpenAI {
    if (!this.client) this.client = new OpenAI();
    return this.client;
  }

  async chat(userId: string, promptKey: WizardPromptKey): Promise<WizardChatResponse> {
    if (!process.env.OPENAI_API_KEY) {
      throw new AppError('OPENAI_API_KEY is not configured', 500);
    }

    const payload = await this.buildPayload(userId, promptKey);

    const response = await this.openai().responses.create({
      model: WIZARD_MODEL,
      instructions: WIZARD_PERSONA,
      input: JSON.stringify(payload),
    });

    const message = response.output_text?.trim();
    if (!message) {
      throw new AppError('The wizard could not conjure a response', 502);
    }

    return { message };
  }

  private async buildPayload(userId: string, promptKey: WizardPromptKey): Promise<WizardPayload> {
    const task = TASKS[promptKey];
    switch (promptKey) {
      case 'spending_breakdown':
        return { task, data: await this.spendingBreakdown(userId) };
      case 'budget_adherence':
        return { task, data: await this.budgetAdherence(userId) };
      case 'saving_opportunities':
        return { task, data: await this.savingOpportunities(userId) };
      case 'spending_patterns':
        return { task, data: await this.spendingPatterns(userId) };
      default:
        throw new AppError('Unknown wizard prompt key', 400);
    }
  }

  // Top 5 spending guilds (tags) for the current month.
  private async spendingBreakdown(userId: string): Promise<{ month: string; topCategories: CategoryTotal[] }> {
    const { month, year, label } = this.currentMonth();
    const expenses = await this.transactions.findManyForUser(userId, { month, year });
    const topCategories = this.toSortedTotals(this.sumByTag(expenses)).slice(0, 5);
    return { month: label, topCategories };
  }

  // Budget vs actual spend per vault (treasure coffer) for the current month.
  private async budgetAdherence(userId: string): Promise<{ month: string; coffers: VaultBudgetStatus[] }> {
    const { month, year, label } = this.currentMonth();
    const [expenses, vaults] = await Promise.all([this.transactions.findManyForUser(userId, { month, year }), this.vaults.findManyForUser(userId)]);

    const spentByVault = new Map<string, number>();
    for (const expense of expenses) {
      if (expense.type !== 'expense' || !expense.vaultId) continue;
      spentByVault.set(expense.vaultId, (spentByVault.get(expense.vaultId) ?? 0) + Number(expense.amount));
    }

    const coffers = vaults.filter((vault) => vault.monthlyBudget != null).map((vault) => ({ vault: vault.name, budget: Number(vault.monthlyBudget), spent: spentByVault.get(vault.id) ?? 0 }));

    return { month: label, coffers };
  }

  // Guilds with the highest total spend across the last 3 months.
  private async savingOpportunities(userId: string): Promise<{ monthsConsidered: number; topCategories: CategoryTotal[] }> {
    const months = this.lastMonths(3);
    const expenses = (await Promise.all(months.map((m) => this.transactions.findManyForUser(userId, { month: m.month, year: m.year })))).flat();
    const topCategories = this.toSortedTotals(this.sumByTag(expenses)).slice(0, 5);
    return { monthsConsidered: months.length, topCategories };
  }

  // Month-over-month guild totals for the last 3 months.
  private async spendingPatterns(userId: string): Promise<MonthlyCategoryTotals[]> {
    const months = this.lastMonths(3);
    const perMonth = await Promise.all(months.map((m) => this.transactions.findManyForUser(userId, { month: m.month, year: m.year })));
    return months.map((m, index) => ({ month: m.label, categories: this.toSortedTotals(this.sumByTag(perMonth[index])) }));
  }

  /**
   * Sum expense amounts per tag name. Tags are the app's spending categories,
   * linked via the transaction_tags join table; an expense with multiple tags
   * counts toward each. Income rows and untagged spend are handled explicitly.
   */
  private sumByTag(expenses: Expense[]): Map<string, number> {
    const totals = new Map<string, number>();
    for (const expense of expenses) {
      if (expense.type !== 'expense') continue;
      const amount = Number(expense.amount);
      const links = expense.transactionTags ?? [];
      if (links.length === 0) {
        totals.set('Untagged', (totals.get('Untagged') ?? 0) + amount);
        continue;
      }
      for (const link of links) {
        const name = link.tag?.name ?? 'Untagged';
        totals.set(name, (totals.get(name) ?? 0) + amount);
      }
    }
    return totals;
  }

  private toSortedTotals(totals: Map<string, number>): CategoryTotal[] {
    return [...totals.entries()].map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total);
  }

  private currentMonth(): { month: number; year: number; label: string } {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear(), label: this.label(now) };
  }

  private lastMonths(count: number): { month: number; year: number; label: string }[] {
    const now = new Date();
    const months: { month: number; year: number; label: string }[] = [];
    for (let offset = count - 1; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      months.push({ month: date.getMonth() + 1, year: date.getFullYear(), label: this.label(date) });
    }
    return months;
  }

  private label(date: Date): string {
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }
}
