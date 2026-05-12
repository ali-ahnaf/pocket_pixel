import { NextFunction, Request, Response } from 'express';
import { verifyAuthToken } from '../routes/auth/shared';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header('Authorization');

  if (!authorization) {
    return res.status(401).json({ message: 'Authorization header is required' });
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Invalid authorization header' });
  }

  try {
    const payload = verifyAuthToken(token);

    if (req.params.userId && req.params.userId !== payload.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    res.locals.authUser = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
