import bcrypt from 'bcryptjs';
import type { SignInPayload, SignUpPayload } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import type { User } from '../entities/User.entity';
import type { SessionStore } from '../lib/auth/session-store';
import type { UsersRepository } from '../repositories/users.repository';
import { AuthService } from '../services/auth.service';

jest.mock('../services', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// The real store imports expo-secure-store, a native module Jest cannot load.
jest.mock('../lib/auth/session-store', () => ({ sessionStore: {} }));

type UsersRepositoryMock = jest.Mocked<Pick<UsersRepository, 'findById' | 'findByEmail' | 'createWithMainStash' | 'save'>>;

const buildUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    avatar: 'avatar.png',
    password: 'hashed-password',
    ...overrides,
  }) as User;

describe('AuthService', () => {
  let users: UsersRepositoryMock;
  let session: jest.Mocked<SessionStore>;
  let service: AuthService;

  beforeEach(() => {
    users = { findById: jest.fn(), findByEmail: jest.fn(), createWithMainStash: jest.fn(), save: jest.fn() };
    session = { get: jest.fn(), set: jest.fn(), clear: jest.fn() };
    service = new AuthService(users as unknown as UsersRepository, session);
  });

  describe('signUp', () => {
    const payload: SignUpPayload = { name: 'Ada Lovelace', email: ' Ada@Example.com ', password: 's3cret-pass', avatar: 'avatar.png' };

    it('saves the user with a normalized email and a hashed password, then starts the session', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.createWithMainStash.mockResolvedValue(buildUser());

      const userId = await service.signUp(payload);

      expect(users.findByEmail).toHaveBeenCalledWith('ada@example.com');
      const created = users.createWithMainStash.mock.calls[0][0];
      expect(created).toMatchObject({ name: payload.name, email: 'ada@example.com', avatar: payload.avatar });
      expect(created.password).not.toBe(payload.password);
      await expect(bcrypt.compare(payload.password, created.password as string)).resolves.toBe(true);
      expect(userId).toBe('user-1');
      expect(session.set).toHaveBeenCalledWith('user-1');
    });

    it('defaults avatar to an empty string when omitted', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.createWithMainStash.mockResolvedValue(buildUser({ avatar: '' }));

      const { avatar, ...rest } = payload;
      await service.signUp(rest);

      expect(users.createWithMainStash.mock.calls[0][0]).toMatchObject({ avatar: '' });
    });

    it('rejects a duplicate email with a 409 AppError and starts no session', async () => {
      users.findByEmail.mockResolvedValue(buildUser());

      await expect(service.signUp(payload)).rejects.toMatchObject({ constructor: AppError, statusCode: 409 });
      expect(users.createWithMainStash).not.toHaveBeenCalled();
      expect(session.set).not.toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    const payload: SignInPayload = { email: ' Ada@Example.com ', password: 's3cret-pass' };

    it('returns the user id and starts the session on correct credentials', async () => {
      users.findByEmail.mockResolvedValue(buildUser({ password: await bcrypt.hash(payload.password, 4) }));

      await expect(service.signIn(payload)).resolves.toBe('user-1');
      expect(users.findByEmail).toHaveBeenCalledWith('ada@example.com');
      expect(session.set).toHaveBeenCalledWith('user-1');
    });

    it.each([
      ['the user does not exist', null],
      ['the account has no password', buildUser({ password: null })],
      ['the password does not match', buildUser({ password: bcrypt.hashSync('a-different-password', 4) })],
    ])('throws a 401 AppError when %s', async (_case, user) => {
      users.findByEmail.mockResolvedValue(user);

      await expect(service.signIn(payload)).rejects.toMatchObject({ constructor: AppError, statusCode: 401, message: 'Invalid credentials' });
      expect(session.set).not.toHaveBeenCalled();
    });
  });

  describe('restoreSession', () => {
    it('returns the stored user id when that user still exists', async () => {
      session.get.mockResolvedValue('user-1');
      users.findById.mockResolvedValue(buildUser());

      await expect(service.restoreSession()).resolves.toBe('user-1');
    });

    it('returns null when no session is stored', async () => {
      session.get.mockResolvedValue(null);

      await expect(service.restoreSession()).resolves.toBeNull();
      expect(users.findById).not.toHaveBeenCalled();
    });

    it('clears a session whose user no longer exists', async () => {
      session.get.mockResolvedValue('gone');
      users.findById.mockResolvedValue(null);

      await expect(service.restoreSession()).resolves.toBeNull();
      expect(session.clear).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('hashes and saves the new password when the current one matches', async () => {
      const user = buildUser({ password: await bcrypt.hash('old-pass', 4) });
      users.findById.mockResolvedValue(user);

      await service.changePassword('user-1', { currentPassword: 'old-pass', newPassword: 'new-pass-1' });

      const saved = users.save.mock.calls[0][0];
      expect(saved.password).not.toBe('new-pass-1');
      await expect(bcrypt.compare('new-pass-1', saved.password as string)).resolves.toBe(true);
    });

    it('rejects a wrong current password with a 401 AppError and saves nothing', async () => {
      users.findById.mockResolvedValue(buildUser({ password: await bcrypt.hash('old-pass', 4) }));

      await expect(service.changePassword('user-1', { currentPassword: 'nope', newPassword: 'new-pass-1' })).rejects.toMatchObject({ statusCode: 401 });
      expect(users.save).not.toHaveBeenCalled();
    });

    it('rejects an unknown user with a 404 AppError', async () => {
      users.findById.mockResolvedValue(null);

      await expect(service.changePassword('missing', { currentPassword: 'a', newPassword: 'b' })).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('resetPassword', () => {
    it('hashes and saves the new password for the normalized email', async () => {
      users.findByEmail.mockResolvedValue(buildUser());

      await service.resetPassword(' Ada@Example.com ', 'new-pass-1');

      expect(users.findByEmail).toHaveBeenCalledWith('ada@example.com');
      const saved = users.save.mock.calls[0][0];
      await expect(bcrypt.compare('new-pass-1', saved.password as string)).resolves.toBe(true);
    });

    it('rejects an unknown email with a 404 AppError and saves nothing', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(service.resetPassword('x@example.com', 'new-pass-1')).rejects.toMatchObject({ statusCode: 404 });
      expect(users.save).not.toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('clears the stored session', async () => {
      await service.signOut();

      expect(session.clear).toHaveBeenCalled();
    });
  });
});
