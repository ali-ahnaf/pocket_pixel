import { authenticate } from '../middleware/auth';
import { authService, logger } from '../services';

jest.mock('../services', () => ({
  authService: { verifyToken: jest.fn() },
  logger: { debug: jest.fn() },
  utilService: { replyError: jest.fn() },
}));

describe('authenticate middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses a JWT from the auth cookie when the Authorization header is absent', () => {
    const req = {
      header: jest.fn().mockReturnValue(undefined),
      cookies: { auth_token: 'cookie-token' },
    } as any;
    const res = {} as any;
    const next = jest.fn();
    const payload = { userId: 'user-1', name: 'Ada', email: 'ada@example.com', avatar: '' };

    (authService.verifyToken as jest.Mock).mockReturnValue(payload);

    authenticate(req, res, next);

    expect(authService.verifyToken).toHaveBeenCalledWith('cookie-token');
    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalled();
    expect(logger.debug).not.toHaveBeenCalled();
  });
});
