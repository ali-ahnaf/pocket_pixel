/**
 * Wizard chat for the app: a small tool-calling agent loop over the local database.
 * The model gets read-only tools that return pre-aggregated rows, so it pulls only
 * the totals it needs instead of receiving every transaction up front. `complete` is
 * injected by `AiService` so tests stay offline.
 */

import type { TransactionType, WizardPromptKey } from '@expense-tracker/shared';
import type { AnalyticsRepository, DateRange } from '../../repositories/analytics.repository';
import type { ChatMessage, ChatParams, Completion, ToolDefinition } from './openrouter';

// Seed personality handed to the model as the system message.
export const WIZARD_PERSONA = `You are Aldric the Wise, an ancient and benevolent wizard who guides adventurers through the realm of their finances. Speak in character: warm, encouraging, and a touch dramatic, never dull. Call money "gold", budgets "treasure coffers", spending categories "guilds", and savings goals "quests". Use the tools to read the adventurer's real data before answering. Call as few tools as needed and prefer one call with a wide date range over many narrow ones. Never invent figures that the tools did not return; if the data is empty, say so. Answer in 2-4 short sentences, citing concrete numbers as gold, under 120 words, and close on an encouraging note.`;

// The question for each prompt key, with a hint at the tool that answers it so most prompts finish in one tool round.
export const TASKS: Record<WizardPromptKey, string> = {
  spending_breakdown: 'Where is my gold going this month? Summarize my top spending guilds (spending_by_tag for this month).',
  budget_adherence: 'Am I on track this month? For each treasure coffer with a budget, say whether I am on track or overspending (vault_budgets for this month).',
  saving_opportunities: 'How can I save more gold? Find the guilds where I spend the most over the last three months and suggest 2-3 concrete ways to save.',
  spending_patterns: 'What patterns do you see? Describe month-over-month trends and notable anomalies across my guilds over the last three months.',
};

// Tool rounds before the model is forced to answer. Each round can run several tools in parallel.
const MAX_TOOL_ROUNDS = 4;
// Per call. Leaves room for reasoning models; the answer itself is under 120 words.
const WIZARD_MAX_TOKENS = 1500;
const MAX_ROWS = 25;

const dateRangeProps = {
  from: { type: 'string', description: 'Start date, YYYY-MM-DD, inclusive. Defaults to the 1st of this month.' },
  to: { type: 'string', description: 'End date, YYYY-MM-DD, inclusive. Defaults to today.' },
};

export const WIZARD_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'spending_by_tag',
      description: 'Totals per tag (guild) in a date range, highest first. A transaction with several tags counts toward each.',
      parameters: {
        type: 'object',
        properties: { ...dateRangeProps, type: { type: 'string', enum: ['expense', 'income'], description: 'Defaults to expense.' }, limit: { type: 'integer', description: 'Max rows, default 8.' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'totals_by_month',
      description: 'Expense and income totals and transaction count per month in a date range.',
      parameters: { type: 'object', properties: dateRangeProps },
    },
  },
  {
    type: 'function',
    function: {
      name: 'vault_budgets',
      description: 'Expense total per vault (treasure coffer) in a date range, with its monthly budget (null when unset).',
      parameters: { type: 'object', properties: dateRangeProps },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_transactions',
      description: 'Individual transactions in a date range, filtered and sorted. Use for drilling into a tag, vault, or merchant, not for totals.',
      parameters: {
        type: 'object',
        properties: {
          ...dateRangeProps,
          type: { type: 'string', enum: ['expense', 'income'] },
          tag: { type: 'string', description: 'Exact tag name.' },
          vault: { type: 'string', description: 'Exact vault name.' },
          search: { type: 'string', description: 'Text contained in the title.' },
          sort_by: { type: 'string', enum: ['amount', 'date'], description: 'Defaults to amount, largest first.' },
          limit: { type: 'integer', description: `Max rows, default 10, at most ${MAX_ROWS}.` },
        },
      },
    },
  },
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const toIsoDate = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const textArg = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

const limitArg = (value: unknown, fallback: number): number => (typeof value === 'number' && value > 0 ? Math.min(Math.floor(value), MAX_ROWS) : fallback);

const typeArg = (value: unknown): TransactionType | undefined => (value === 'expense' || value === 'income' ? value : undefined);

function rangeArg(args: Record<string, unknown>, today: Date): DateRange {
  const from = textArg(args.from);
  const to = textArg(args.to);
  return {
    from: from && ISO_DATE.test(from) ? from : toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: to && ISO_DATE.test(to) ? to : toIsoDate(today),
  };
}

/**
 * Runs one tool call against the read-only analytics queries and returns compact JSON.
 * Bad arguments or unknown tools come back as `{ error }` so the model can correct itself
 * instead of failing the whole chat. Every query is scoped to `userId`.
 */
export async function runWizardTool(analytics: AnalyticsRepository, userId: string, name: string, rawArgs: string, today: Date = new Date()): Promise<string> {
  let args: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(rawArgs || '{}');
    args = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return JSON.stringify({ error: 'Arguments were not valid JSON.' });
  }

  const range = rangeArg(args, today);
  switch (name) {
    case 'spending_by_tag':
      return JSON.stringify(await analytics.tagTotals(userId, range, typeArg(args.type) ?? 'expense', limitArg(args.limit, 8)));
    case 'totals_by_month':
      return JSON.stringify(await analytics.monthTotals(userId, range));
    case 'vault_budgets':
      return JSON.stringify(await analytics.vaultSpend(userId, range));
    case 'find_transactions':
      return JSON.stringify(
        await analytics.findTransactions(userId, {
          ...range,
          type: typeArg(args.type),
          tag: textArg(args.tag),
          vault: textArg(args.vault),
          search: textArg(args.search),
          sortBy: args.sort_by === 'date' ? 'date' : 'amount',
          limit: limitArg(args.limit, 10),
        }),
      );
    default:
      return JSON.stringify({ error: `Unknown tool ${name}.` });
  }
}

/**
 * Asks the wizard `promptKey`. Loops: the model calls tools, we run them and send the
 * results back, until it answers or runs out of tool rounds (then tools are switched off
 * so it must answer). Throws if OpenRouter fails or the final answer is empty.
 */
export async function getWizardResponse(
  complete: (params: ChatParams) => Promise<Completion>,
  runTool: (name: string, args: string) => Promise<string>,
  promptKey: WizardPromptKey,
  apiKey: string,
  model: string,
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: `${WIZARD_PERSONA}\nToday is ${toIsoDate(new Date())}.` },
    { role: 'user', content: TASKS[promptKey] },
  ];

  for (let round = 0; ; round += 1) {
    const canUseTools = round < MAX_TOOL_ROUNDS;
    const reply = await complete({ apiKey, model, messages, tools: WIZARD_TOOLS, toolChoice: canUseTools ? 'auto' : 'none', maxTokens: WIZARD_MAX_TOKENS });

    if (!canUseTools || reply.toolCalls.length === 0) {
      const answer = reply.content?.trim();
      if (!answer) {
        throw new Error('The wizard could not conjure a response');
      }
      return answer;
    }

    messages.push({ role: 'assistant', content: reply.content, tool_calls: reply.toolCalls });
    const results = await Promise.all(reply.toolCalls.map((call) => runTool(call.function.name, call.function.arguments)));
    reply.toolCalls.forEach((call, index) => messages.push({ role: 'tool', tool_call_id: call.id, content: results[index] }));
  }
}
