import OpenAI from 'openai';
import { AppError } from '../errors/app-error';
import { OPENAI_MODEL, PromptService } from '../services/prompt.service';

const mockResponsesCreate = jest.fn();
const mockUsageCompletions = jest.fn();

jest.mock('../services', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  tagsService: { listCached: jest.fn() },
}));

jest.mock('openai');

const { tagsService } = jest.requireMock('../services') as {
  tagsService: { listCached: jest.Mock };
};
const mockListCached = tagsService.listCached;
const mockedOpenAI = OpenAI as unknown as jest.Mock;

describe('PromptService', () => {
  let service: PromptService;
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalAdminKey = process.env.OPENAI_ADMIN_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_ADMIN_KEY;
    mockedOpenAI.mockImplementation((options?: { adminAPIKey?: string }) => ({
      responses: { create: mockResponsesCreate },
      admin: {
        organization: {
          usage: {
            completions: mockUsageCompletions,
          },
        },
      },
      options,
    }));
    service = new PromptService();
  });

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalApiKey;
    }

    if (originalAdminKey === undefined) {
      delete process.env.OPENAI_ADMIN_KEY;
    } else {
      process.env.OPENAI_ADMIN_KEY = originalAdminKey;
    }
  });

  describe('parseTransaction', () => {
    it('throws a 500 AppError when OPENAI_API_KEY is not set', async () => {
      await expect(service.parseTransaction('user-1', 'coffee')).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 500,
      });
      expect(mockListCached).not.toHaveBeenCalled();
      expect(mockResponsesCreate).not.toHaveBeenCalled();
    });

    it('returns the parsed transaction and resolves tag names back to ids', async () => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
      mockListCached.mockResolvedValue([
        { id: 'tag-food', name: 'Food' },
        { id: 'tag-travel', name: 'Travel' },
      ]);
      mockResponsesCreate.mockResolvedValue({
        output_text: JSON.stringify({
          title: 'Morning coffee',
          amount: 4.5,
          type: 'expense',
          tags: ['food', 'TRAVEL', 'unknown', 123],
        }),
      });

      const result = await service.parseTransaction('user-1', 'Bought coffee before work');

      expect(mockedOpenAI).toHaveBeenCalledWith();
      expect(mockListCached).toHaveBeenCalledWith('user-1');
      expect(mockResponsesCreate).toHaveBeenCalledWith({
        model: OPENAI_MODEL,
        input: expect.stringContaining('prompt: Bought coffee before work'),
        text: {
          format: {
            type: 'json_schema',
            name: 'transaction',
            strict: true,
            schema: expect.objectContaining({
              properties: expect.objectContaining({
                tags: {
                  type: 'array',
                  items: { type: 'string', enum: ['Food', 'Travel'] },
                },
              }),
            }),
          },
        },
      });
      expect(result).toEqual({
        title: 'Morning coffee',
        amount: 4.5,
        type: 'expense',
        tagIds: ['tag-food', 'tag-travel'],
      });
    });

    it('falls back to a plain string-array schema when the user has no tags', async () => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
      mockListCached.mockResolvedValue([]);
      mockResponsesCreate.mockResolvedValue({
        output_text: JSON.stringify({
          title: 'Monthly salary',
          amount: 3000,
          type: 'income',
          tags: ['Salary'],
        }),
      });

      const result = await service.parseTransaction('user-1', 'Salary came in');

      expect(mockResponsesCreate.mock.calls[0][0].text.format.schema.properties.tags).toEqual({
        type: 'array',
        items: { type: 'string' },
      });
      expect(result).toEqual({
        title: 'Monthly salary',
        amount: 3000,
        type: 'income',
        tagIds: [],
      });
    });

    it('throws a 502 AppError when the AI response is not valid JSON', async () => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
      mockListCached.mockResolvedValue([]);
      mockResponsesCreate.mockResolvedValue({ output_text: 'not-json' });

      await expect(service.parseTransaction('user-1', 'Coffee')).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 502,
      });
    });
  });

  describe('usage', () => {
    it('throws a 500 AppError when OPENAI_ADMIN_KEY is not set', async () => {
      await expect(service.usage()).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 500,
      });
      expect(mockUsageCompletions).not.toHaveBeenCalled();
    });

    it('correctly adds up paginated usage results by model', async () => {
      process.env.OPENAI_ADMIN_KEY = 'test-admin-key';
      jest.spyOn(service as any, 'startOfMonthUnix').mockReturnValue(1717200000);
      mockUsageCompletions.mockResolvedValueOnce({
        data: [
          {
            results: [
              {
                object: 'organization.usage.completions.result',
                model: 'gpt-5.4-nano',
                input_tokens: 100,
                output_tokens: 50,
                num_model_requests: 2,
              },
              {
                object: 'organization.usage.completions.result',
                model: 'gpt-4.1-mini',
                input_tokens: 10,
                output_tokens: 5,
                num_model_requests: 1,
              },
              {
                object: 'organization.usage.bucket',
                model: 'ignored',
                input_tokens: 999,
                output_tokens: 999,
                num_model_requests: 999,
              },
            ],
          },
        ],
        next_page: 'page-2',
      });
      mockUsageCompletions.mockResolvedValueOnce({
        data: [
          {
            results: [
              {
                object: 'organization.usage.completions.result',
                model: 'gpt-5.4-nano',
                input_tokens: 20,
                output_tokens: 10,
                num_model_requests: 1,
              },
              {
                object: 'organization.usage.completions.result',
                model: null,
                input_tokens: 7,
                output_tokens: 3,
                num_model_requests: 1,
              },
            ],
          },
        ],
        next_page: null,
      });

      const report = await service.usage();

      expect(mockedOpenAI).toHaveBeenCalledWith({ adminAPIKey: 'test-admin-key' });
      expect(mockUsageCompletions).toHaveBeenNthCalledWith(1, {
        start_time: 1717200000,
        bucket_width: '1d',
        limit: 31,
        group_by: ['model'],
      });
      expect(mockUsageCompletions).toHaveBeenNthCalledWith(2, {
        start_time: 1717200000,
        bucket_width: '1d',
        limit: 31,
        group_by: ['model'],
        page: 'page-2',
      });
      expect(report).toEqual({
        periodStart: 1717200000,
        inputTokens: 137,
        outputTokens: 68,
        totalTokens: 205,
        requests: 5,
        models: [
          {
            model: 'gpt-5.4-nano',
            inputTokens: 120,
            outputTokens: 60,
            totalTokens: 180,
            requests: 3,
          },
          {
            model: 'gpt-4.1-mini',
            inputTokens: 10,
            outputTokens: 5,
            totalTokens: 15,
            requests: 1,
          },
          {
            model: 'unknown',
            inputTokens: 7,
            outputTokens: 3,
            totalTokens: 10,
            requests: 1,
          },
        ],
      });
    });
  });
});
