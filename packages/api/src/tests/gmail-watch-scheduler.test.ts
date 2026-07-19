import type { UserOAuthCredential } from '../entities/UserOAuthCredential.entity';

const find = jest.fn();
const startWatch = jest.fn();

jest.mock('../data-source', () => ({
  AppDataSource: { getRepository: () => ({ find }) },
}));

jest.mock('../services', () => ({
  gmailService: { startWatch: (...args: unknown[]) => startWatch(...args) },
}));

jest.mock('../services/logger.service', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { renewExpiringGmailWatches } from '../scheduler/gmail-watch-scheduler';

const credential = (overrides: Partial<UserOAuthCredential>): UserOAuthCredential => ({ userId: 'u', gmailLabelIds: ['L1'], ...overrides }) as UserOAuthCredential;

describe('renewExpiringGmailWatches', () => {
  beforeEach(() => jest.clearAllMocks());

  it('re-watches every due credential that has labels', async () => {
    find.mockResolvedValue([credential({ userId: 'u1' }), credential({ userId: 'u2' })]);
    startWatch.mockResolvedValue({});

    await renewExpiringGmailWatches();

    expect(startWatch).toHaveBeenCalledTimes(2);
    expect(startWatch).toHaveBeenCalledWith('u1');
    expect(startWatch).toHaveBeenCalledWith('u2');
  });

  it('skips credentials with no selected labels', async () => {
    find.mockResolvedValue([credential({ userId: 'u1', gmailLabelIds: [] }), credential({ userId: 'u2', gmailLabelIds: null })]);

    await renewExpiringGmailWatches();

    expect(startWatch).not.toHaveBeenCalled();
  });

  it('continues past a failing renewal (e.g. revoked token) without throwing', async () => {
    find.mockResolvedValue([credential({ userId: 'u1' }), credential({ userId: 'u2' })]);
    startWatch.mockRejectedValueOnce(new Error('revoked')).mockResolvedValueOnce({});

    await expect(renewExpiringGmailWatches()).resolves.toBeUndefined();
    expect(startWatch).toHaveBeenCalledTimes(2);
  });
});
