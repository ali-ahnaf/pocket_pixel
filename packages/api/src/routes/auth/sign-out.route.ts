import { Request, Response, Router } from 'express';
import { AUTH_TOKEN_KEY } from '../../services/auth.service';

const router = Router();

router.post('/sign-out', (_req: Request, res: Response) => {
  res.clearCookie(AUTH_TOKEN_KEY, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.json({ message: 'Signed out' });
});

export default router;
