import type { UserOAuthCredential } from '../entities/UserOAuthCredential.entity';
import type { UserOAuthCredentialRepository } from '../repositories/user-oauth-credential.repository';
import { UserOAuthCredentialService } from '../services/user-oauth-credential.service';

jest.mock('../services', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../utils/oauth-credentials-encryption.util', () => ({
  encrypt: jest.fn((plaintext: string) => `encrypted(${plaintext})`),
}));

import { encrypt } from '../utils/oauth-credentials-encryption.util';

type UserOAuthCredentialRepositoryMock = jest.Mocked<Pick<UserOAuthCredentialRepository, 'findByUserId' | 'createEntity' | 'save'>>;

const buildCredential = (overrides: Partial<UserOAuthCredential> = {}): UserOAuthCredential =>
  ({
    id: 'cred-1',
    userId: 'user-1',
    googleClientIdEncrypted: 'encrypted(old-id)',
    googleClientSecretEncrypted: 'encrypted(old-secret)',
    ...overrides,
  }) as UserOAuthCredential;

describe('UserOAuthCredentialService', () => {
  let credentials: UserOAuthCredentialRepositoryMock;
  let service: UserOAuthCredentialService;

  beforeEach(() => {
    credentials = {
      findByUserId: jest.fn(),
      createEntity: jest.fn((data) => data as UserOAuthCredential),
      save: jest.fn(),
    };
    service = new UserOAuthCredentialService(credentials as unknown as UserOAuthCredentialRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setCredentials', () => {
    it('creates a new row and encrypts both fields when none exists', async () => {
      credentials.findByUserId.mockResolvedValue(null);
      const saved = buildCredential();
      credentials.save.mockResolvedValue(saved);

      const result = await service.setCredentials('user-1', { clientId: 'client-id', clientSecret: 'client-secret' });

      expect(encrypt).toHaveBeenCalledWith('client-id');
      expect(encrypt).toHaveBeenCalledWith('client-secret');
      expect(credentials.createEntity).toHaveBeenCalledWith({
        userId: 'user-1',
        googleClientIdEncrypted: 'encrypted(client-id)',
        googleClientSecretEncrypted: 'encrypted(client-secret)',
      });
      expect(credentials.save).toHaveBeenCalledTimes(1);
      expect(result).toBe(saved);
    });

    it('overwrites the encrypted fields on an existing row', async () => {
      const existing = buildCredential();
      credentials.findByUserId.mockResolvedValue(existing);
      credentials.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.setCredentials('user-1', { clientId: 'new-id', clientSecret: 'new-secret' });

      expect(credentials.createEntity).not.toHaveBeenCalled();
      expect(credentials.save).toHaveBeenCalledTimes(1);
      expect(result.googleClientIdEncrypted).toBe('encrypted(new-id)');
      expect(result.googleClientSecretEncrypted).toBe('encrypted(new-secret)');
    });
  });

  describe('getStatus', () => {
    it('returns configured: true when a row exists', async () => {
      credentials.findByUserId.mockResolvedValue(buildCredential());

      const result = await service.getStatus('user-1');

      expect(result).toEqual({ configured: true });
    });

    it('returns configured: false when no row exists, without decrypting anything', async () => {
      credentials.findByUserId.mockResolvedValue(null);

      const result = await service.getStatus('user-1');

      expect(result).toEqual({ configured: false });
    });
  });
});
