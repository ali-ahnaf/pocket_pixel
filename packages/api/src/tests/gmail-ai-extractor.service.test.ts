import OpenAI from 'openai';
import { AppError } from '../errors/app-error';
import { GmailAiExtractorService, GMAIL_EXTRACTOR_MODEL } from '../services/gmail-ai-extractor.service';
import type { GmailMessageContent } from '../utils/gmail-message.util';

jest.mock('../services', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockResponsesCreate = jest.fn();

jest.mock('openai');

const mockedOpenAI = OpenAI as unknown as jest.Mock;

const email = (overrides: Partial<GmailMessageContent> = {}): GmailMessageContent => ({
  from: 'alerts@bank.com',
  subject: 'Transaction Alert',
  bodyText: 'You spent BDT 1,500.00 at DARAZ',
  emailDate: null,
  ...overrides,
});

const tags = [
  { id: 'tag-1', name: 'Shopping' },
  { id: 'tag-2', name: 'Food' },
];

const mockOutput = (payload: unknown): jest.Mock => mockResponsesCreate.mockResolvedValue({ output_text: JSON.stringify(payload) });

describe('GmailAiExtractorService', () => {
  let service: GmailAiExtractorService;
  const originalApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-openai-key';
    mockedOpenAI.mockImplementation(() => ({ responses: { create: mockResponsesCreate } }));
    service = new GmailAiExtractorService();
  });

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalApiKey;
    }
  });

  it('throws a 500 AppError when OPENAI_API_KEY is not set', async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(service.extract(email(), tags)).rejects.toMatchObject({ constructor: AppError, statusCode: 500 });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it('sends the extractor instructions, model, and structured-output schema, returning a validated ParsedEmailDto', async () => {
    mockOutput({ matched: true, title: 'DARAZ', amount: 1500, type: 'expense', tagIds: ['tag-1'] });
    const today = new Date().toISOString().split('T')[0];

    const result = await service.extract(email(), tags, 'always shopping');

    expect(result).toEqual({ title: 'DARAZ', amount: 1500, type: 'expense', date: today, tagIds: ['tag-1'] });

    const call = mockResponsesCreate.mock.calls[0][0];
    expect(call.model).toBe(GMAIL_EXTRACTOR_MODEL);
    expect(call.instructions).toContain('bank/card transaction email parser');
    expect(call.text.format).toMatchObject({ type: 'json_schema', strict: true });
    expect(call.text.format.schema.required).toEqual(['matched', 'title', 'amount', 'type', 'tagIds']);

    const input = JSON.parse(call.input);
    expect(input.email).toMatchObject({ from: 'alerts@bank.com', subject: 'Transaction Alert' });
    expect(input.availableTags).toEqual(tags);
    expect(input.guidance).toBe('always shopping');
  });

  it('sends guidance as null when the watcher has none', async () => {
    mockOutput({ matched: true, title: 'DARAZ', amount: 1500, type: 'expense', tagIds: [] });

    await service.extract(email(), tags);

    const input = JSON.parse(mockResponsesCreate.mock.calls[0][0].input);
    expect(input.guidance).toBeNull();
  });

  it('returns null when the model reports matched:false (not a transaction)', async () => {
    mockOutput({ matched: false, title: '', amount: 0, type: 'expense', tagIds: [] });

    await expect(service.extract(email(), tags)).resolves.toBeNull();
  });

  it('filters out a hallucinated tag id not present in the user’s tag set', async () => {
    mockOutput({ matched: true, title: 'DARAZ', amount: 1500, type: 'expense', tagIds: ['tag-1', 'tag-does-not-exist'] });

    const result = await service.extract(email(), tags);

    expect(result?.tagIds).toEqual(['tag-1']);
  });

  it('returns null when amount is not greater than 0', async () => {
    mockOutput({ matched: true, title: 'DARAZ', amount: 0, type: 'expense', tagIds: [] });

    await expect(service.extract(email(), tags)).resolves.toBeNull();
  });

  it('returns null when title is empty', async () => {
    mockOutput({ matched: true, title: '   ', amount: 1500, type: 'expense', tagIds: [] });

    await expect(service.extract(email(), tags)).resolves.toBeNull();
  });

  it('returns null when the model output is unparsable JSON', async () => {
    mockResponsesCreate.mockResolvedValue({ output_text: 'not json' });

    await expect(service.extract(email(), tags)).resolves.toBeNull();
  });

  it('returns null when the model returns no output text', async () => {
    mockResponsesCreate.mockResolvedValue({ output_text: undefined });

    await expect(service.extract(email(), tags)).resolves.toBeNull();
  });
});
