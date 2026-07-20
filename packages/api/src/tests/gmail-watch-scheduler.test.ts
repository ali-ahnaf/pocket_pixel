import type { UserOAuthCredential } from '../entities/UserOAuthCredential.entity';

const find = jest.fn();
const startWatch = jest.fn();
const findManyForUser = jest.fn();

jest.mock('../data-source', () => ({
  AppDataSource: { getRepository: () => ({ find }) },
}));

jest.mock('../services', () => ({
  gmailService: { startWatch: (...args: unknown[]) => startWatch(...args) },
}));

jest.mock('../repositories', () => ({
  vaultGmailWatchersRepository: { findManyForUser: (...args: unknown[]) => findManyForUser(...args) },
}));

jest.mock('../services/logger.service', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { renewExpiringGmailWatches } from '../scheduler/gmail-watch-scheduler';

const credential = (overrides: Partial<UserOAuthCredential>): UserOAuthCredential => ({ userId: 'u', ...overrides }) as UserOAuthCredential;

describe('renewExpiringGmailWatches', () => {
  beforeEach(() => jest.clearAllMocks());

  it('re-watches every due credential that has attached watchers', async () => {
    find.mockResolvedValue([credential({ userId: 'u1' }), credential({ userId: 'u2' })]);
    findManyForUser.mockResolvedValue([{ gmailLabelId: 'L1' }]);
    startWatch.mockResolvedValue({});

    await renewExpiringGmailWatches();

    expect(startWatch).toHaveBeenCalledTimes(2);
    expect(startWatch).toHaveBeenCalledWith('u1');
    expect(startWatch).toHaveBeenCalledWith('u2');
  });

  it('skips credentials with no attached watchers', async () => {
    find.mockResolvedValue([credential({ userId: 'u1' }), credential({ userId: 'u2' })]);
    findManyForUser.mockResolvedValue([]);

    await renewExpiringGmailWatches();

    expect(startWatch).not.toHaveBeenCalled();
  });

  it('continues past a failing renewal (e.g. revoked token) without throwing', async () => {
    find.mockResolvedValue([credential({ userId: 'u1' }), credential({ userId: 'u2' })]);
    findManyForUser.mockResolvedValue([{ gmailLabelId: 'L1' }]);
    startWatch.mockRejectedValueOnce(new Error('revoked')).mockResolvedValueOnce({});

    await expect(renewExpiringGmailWatches()).resolves.toBeUndefined();
    expect(startWatch).toHaveBeenCalledTimes(2);
  });
});
