import bcrypt from 'bcryptjs';
import type { SignInPayload, SignUpPayload } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import type { User } from '../entities/User.entity';
import type { UsersRepository } from '../repositories/users.repository';
import type { VaultsRepository } from '../repositories/vaults.repository';
import { AuthService } from '../services/auth.service';

// The service pulls `logger` from the services barrel (`.`), which otherwise
// instantiates every service (and their repositories). Stub it so the unit
// test stays isolated from the rest of the container.
jest.mock('../services', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

type UsersRepositoryMock = jest.Mocked<Pick<UsersRepository, 'findById' | 'findByEmail' | 'createEntity' | 'save'>>;
type VaultsRepositoryMock = jest.Mocked<Pick<VaultsRepository, 'createEntity' | 'save'>>;

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
  let vaults: VaultsRepositoryMock;
  let service: AuthService;

  beforeEach(() => {
    users = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      createEntity: jest.fn((data) => data as User),
      save: jest.fn(),
    };
    vaults = {
      createEntity: jest.fn((data) => data),
      save: jest.fn(),
    } as unknown as VaultsRepositoryMock;
    service = new AuthService(users as unknown as UsersRepository, vaults as unknown as VaultsRepository);
  });

  describe('token helpers', () => {
    it('creates a token that verifies back to the original payload', () => {
      const payload = { userId: 'user-1', name: 'Ada', email: 'ada@example.com', avatar: 'avatar.png' };

      const token = service.createToken(payload);
      const decoded = service.verifyToken(token);

      expect(typeof token).toBe('string');
      expect(decoded).toMatchObject(payload);
    });

    it('throws when verifying a tampered token', () => {
      expect(() => service.verifyToken('not-a-real-token')).toThrow();
    });
  });

  describe('hashPassword', () => {
    it('returns a bcrypt hash that matches the plain password', async () => {
      const hash = await service.hashPassword('s3cret');

      expect(hash).not.toBe('s3cret');
      await expect(bcrypt.compare('s3cret', hash)).resolves.toBe(true);
    });
  });

  describe('signUp', () => {
    const payload: SignUpPayload = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 's3cret',
      avatar: 'avatar.png',
    };

    it('creates the user with a hashed password and a default vault', async () => {
      users.findByEmail.mockResolvedValue(null);
      const savedUser = buildUser();
      users.save.mockResolvedValue(savedUser);
      vaults.save.mockResolvedValue({} as never);

      const result = await service.signUp(payload);

      // Password is hashed, never persisted as-is.
      const created = users.createEntity.mock.calls[0][0];
      expect(created.password).not.toBe(payload.password);
      await expect(bcrypt.compare(payload.password, created.password as string)).resolves.toBe(true);
      expect(created).toMatchObject({ name: payload.name, email: payload.email, avatar: payload.avatar });

      // A default "Main Stash" vault is created for the new user.
      expect(vaults.createEntity).toHaveBeenCalledWith(expect.objectContaining({ userId: savedUser.id, name: 'Main Stash', isDefault: true }));
      expect(vaults.save).toHaveBeenCalledTimes(1);

      expect(result).toMatchObject({
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        avatar: savedUser.avatar,
      });
      expect(service.verifyToken(result.token)).toMatchObject({ userId: savedUser.id });
    });

    it('defaults avatar to an empty string when omitted', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.save.mockResolvedValue(buildUser({ avatar: '' }));
      vaults.save.mockResolvedValue({} as never);

      const { avatar, ...rest } = payload;
      await service.signUp(rest);

      expect(users.createEntity.mock.calls[0][0]).toMatchObject({ avatar: '' });
    });

    it('rejects a duplicate email with a 409 AppError', async () => {
      users.findByEmail.mockResolvedValue(buildUser());

      await expect(service.signUp(payload)).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 409,
      });
      expect(users.save).not.toHaveBeenCalled();
      expect(vaults.save).not.toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    const payload: SignInPayload = { email: 'ada@example.com', password: 's3cret' };

    it('returns an auth result with a valid token on correct credentials', async () => {
      const user = buildUser({ password: await bcrypt.hash(payload.password, 4) });
      users.findByEmail.mockResolvedValue(user);

      const result = await service.signIn(payload);

      expect(result).toMatchObject({ id: user.id, email: user.email, name: user.name });
      expect(service.verifyToken(result.token)).toMatchObject({ userId: user.id });
    });

    it('throws a 401 AppError when the user does not exist', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(service.signIn(payload)).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 401,
      });
    });

    it('throws a 401 AppError when the password does not match', async () => {
      const user = buildUser({ password: await bcrypt.hash('a-different-password', 4) });
      users.findByEmail.mockResolvedValue(user);

      await expect(service.signIn(payload)).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 401,
      });
    });
  });

  describe('changePassword', () => {
    const payload = { currentPassword: 's3cret', newPassword: 'n3w-p4ssword' };

    it('hashes and saves the new password when the current one matches', async () => {
      const user = buildUser({ password: await bcrypt.hash(payload.currentPassword, 4) });
      users.findById.mockResolvedValue(user);
      users.save.mockResolvedValue(user);

      await service.changePassword(user.id, payload);

      const saved = users.save.mock.calls[0][0];
      expect(saved.password).not.toBe(payload.newPassword);
      await expect(bcrypt.compare(payload.newPassword, saved.password!)).resolves.toBe(true);
    });

    it('throws a 401 AppError when the current password is incorrect', async () => {
      const user = buildUser({ password: await bcrypt.hash('a-different-password', 4) });
      users.findById.mockResolvedValue(user);

      await expect(service.changePassword(user.id, payload)).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 401,
      });
      expect(users.save).not.toHaveBeenCalled();
    });

    it('throws a 404 AppError when the user does not exist', async () => {
      users.findById.mockResolvedValue(null);

      await expect(service.changePassword('missing', payload)).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 404,
      });
      expect(users.save).not.toHaveBeenCalled();
    });
  });
});
