import { NextFunction, Request, Response } from 'express';
import { authService, logger, utilService } from '../services';
import type { TokenPayload } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Global, best-effort authentication. Decodes a `Bearer` token or an
 * `auth_token` httpOnly cookie into `req.user` when one is present and valid,
 * and silently leaves `req.user` unset on a missing or invalid token.
 * Never rejects — guarding is `requireAuth`'s job.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  let token: string | undefined;

  const authorization = req.header('Authorization');
  if (authorization) {
    const [scheme, bearerToken] = authorization.split(' ');
    if (scheme === 'Bearer' && bearerToken) {
      token = bearerToken;
    }
  }

  if (!token && req.cookies?.auth_token) {
    token = req.cookies.auth_token;
  }

  if (!token) {
    return next();
  }

  try {
    req.user = authService.verifyToken(token);
  } catch {
    logger.debug('Ignoring invalid auth token');
  }

  return next();
}

/**
 * Per-route guard. Replies `401 Unauthorized` when no authenticated user is
 * present. Once this runs, downstream handlers can rely on `req.user` being set.
 * Add it only to routes that require a logged-in user.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    utilService.replyError(res, 'Unauthorized', 401);
    return;
  }

  return next();
}
