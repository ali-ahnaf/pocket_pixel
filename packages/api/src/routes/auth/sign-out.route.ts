import { Request, Response, Router } from 'express';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  ...(process.env.NODE_ENV === 'production' ? { sameSite: 'lax' as const } : {}),
};

router.post('/sign-out', (_req: Request, res: Response) => {
  res.clearCookie('auth_token', COOKIE_OPTIONS);
  return res.json({ message: 'Signed out' });
});

export default router;
