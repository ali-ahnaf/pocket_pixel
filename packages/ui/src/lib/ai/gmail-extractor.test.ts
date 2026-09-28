import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chat } from './openrouter';
import { extractTransactionFromEmail, toReferenceDate } from './gmail-extractor';

vi.mock('./openrouter', () => ({ chat: vi.fn() }));

const chatMock = vi.mocked(chat);

const modelReply = (overrides: Record<string, unknown> = {}): string => JSON.stringify({ matched: true, title: 'SHOP', amount: 500, type: 'expense', tagIds: [], date: '2026-10-01', ...overrides });

const run = (emailDate: string | null, guidanceHint?: string) =>
  extractTransactionFromEmail({
    apiKey: 'key',
    model: 'model',
    email: { from: 'bank@example.com', subject: 'Card Alert', bodyText: 'Spent BDT 500 at SHOP', emailDate },
    tags: [],
    guidanceHint,
  });

describe('toReferenceDate', () => {
  it('keeps a bare yyyy-mm-dd as-is', () => {
    expect(toReferenceDate('2026-09-29')).toBe('2026-09-29');
  });

  it('resolves an RFC 2822 header to its local date', () => {
    const header = 'Mon, 29 Sep 2026 14:03:00 +0600';
    const d = new Date(header);
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(toReferenceDate(header)).toBe(expected);
  });

  it('falls back to now when missing or unparsable', () => {
    const now = new Date(2026, 8, 28);
    expect(toReferenceDate(null, now)).toBe('2026-09-28');
    expect(toReferenceDate('not a date', now)).toBe('2026-09-28');
  });
});

describe('extractTransactionFromEmail date handling', () => {
  beforeEach(() => chatMock.mockReset());

  it('sends emailDate as referenceDate along with guidance', async () => {
    chatMock.mockResolvedValue(modelReply());

    await run('2026-09-29', 'bill on 1st of next month');

    const userMessage = chatMock.mock.calls[0][0].messages[1].content;
    expect(JSON.parse(userMessage)).toMatchObject({ referenceDate: '2026-09-29', guidance: 'bill on 1st of next month' });
  });

  it('uses the model date when valid', async () => {
    chatMock.mockResolvedValue(modelReply({ date: '2026-10-01' }));

    expect((await run('2026-09-29'))?.date).toBe('2026-10-01');
  });

  it.each(['2026-02-30', '10/01/2026', ''])('falls back to the email date when the model date is %j', async (date) => {
    chatMock.mockResolvedValue(modelReply({ date }));

    expect((await run('2026-09-29'))?.date).toBe('2026-09-29');
  });
});
