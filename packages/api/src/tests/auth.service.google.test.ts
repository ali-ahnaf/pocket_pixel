import type { User } from '../entities/User.entity';
import type { UsersRepository } from '../repositories/users.repository';
import type { VaultsRepository } from '../repositories/vaults.repository';
import type { AuthService } from '../services/auth.service';

// Google client is stubbed so the authorization-code exchange never leaves the
// process. `mock`-prefixed names are allowed inside the hoisted factory.
const mockGetToken = jest.fn();
const mockVerifyIdToken = jest.fn();
const mockGenerateAuthUrl = jest.fn().mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?x=1');

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    getToken: mockGetToken,
    verifyIdToken: mockVerifyIdToken,
    generateAuthUrl: mockGenerateAuthUrl,
  })),
}));

// The service pulls `logger` from the services barrel; stub it so the unit test
// stays isolated from the rest of the container.
jest.mock('../services', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

type UsersRepositoryMock = jest.Mocked<Pick<UsersRepository, 'findByEmail' | 'findByGoogleId' | 'createEntity' | 'save'>>;
type VaultsRepositoryMock = jest.Mocked<Pick<VaultsRepository, 'createEntity' | 'save'>>;

const buildUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    avatar: 'avatar.png',
    password: null,
    googleId: null,
    ...overrides,
  }) as User;

const googleProfile = (overrides: Record<string, unknown> = {}) => ({
  sub: 'google-123',
  email: 'ada@example.com',
  email_verified: true,
  name: 'Ada Lovelace',
  picture: 'https://google/pic.png',
  ...overrides,
});

describe('AuthService.googleSignInWithCode', () => {
  let users: UsersRepositoryMock;
  let vaults: VaultsRepositoryMock;
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:4000/api/auth/google/callback';

    // Re-import so the module-level Google env constants pick up the values above.
    jest.resetModules();
    const { AuthService: AuthServiceCtor } = require('../services/auth.service');

    users = {
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      createEntity: jest.fn((data) => data as User),
      save: jest.fn(),
    };
    vaults = {
      createEntity: jest.fn((data) => data),
      save: jest.fn(),
    } as unknown as VaultsRepositoryMock;
    service = new AuthServiceCtor(users as unknown as UsersRepository, vaults as unknown as VaultsRepository);

    mockGetToken.mockResolvedValue({ tokens: { id_token: 'id-token' } });
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => googleProfile() });
  });

  it('creates a new user and default vault on first Google sign-in', async () => {
    users.findByGoogleId.mockResolvedValue(null);
    users.findByEmail.mockResolvedValue(null);
    const saved = buildUser({ googleId: 'google-123' });
    users.save.mockResolvedValue(saved);
    vaults.save.mockResolvedValue({} as never);

    const result = await service.googleSignInWithCode('auth-code');

    expect(mockGetToken).toHaveBeenCalledWith('auth-code');
    const created = users.createEntity.mock.calls[0][0];
    expect(created).toMatchObject({ email: 'ada@example.com', googleId: 'google-123', password: null });
    expect(vaults.createEntity).toHaveBeenCalledWith(expect.objectContaining({ userId: saved.id, name: 'Main Stash', isDefault: true }));
    expect(service.verifyToken(result.token)).toMatchObject({ userId: saved.id });
  });

  it('links the Google identity to an existing email account without a new vault', async () => {
    users.findByGoogleId.mockResolvedValue(null);
    const existing = buildUser({ avatar: '' });
    users.findByEmail.mockResolvedValue(existing);
    users.save.mockImplementation(async (u) => u as User);

    const result = await service.googleSignInWithCode('auth-code');

    const saved = users.save.mock.calls[0][0];
    expect(saved.googleId).toBe('google-123');
    expect(saved.avatar).toBe('https://google/pic.png');
    expect(vaults.save).not.toHaveBeenCalled();
    expect(result).toMatchObject({ id: existing.id, email: existing.email });
  });

  it('throws a 401 when the code exchange fails', async () => {
    mockGetToken.mockRejectedValue(new Error('bad code'));

    await expect(service.googleSignInWithCode('auth-code')).rejects.toMatchObject({ statusCode: 401 });
    expect(users.save).not.toHaveBeenCalled();
  });

  it('throws a 401 when the exchange returns no id_token', async () => {
    mockGetToken.mockResolvedValue({ tokens: {} });

    await expect(service.googleSignInWithCode('auth-code')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws a 401 when the Google email is not verified', async () => {
    users.findByGoogleId.mockResolvedValue(null);
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => googleProfile({ email_verified: false }) });

    await expect(service.googleSignInWithCode('auth-code')).rejects.toMatchObject({ statusCode: 401 });
  });
});
