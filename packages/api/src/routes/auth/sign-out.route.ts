import { Request, Response, Router } from 'express';
import { clearAuthCookie } from './cookie-options';

const router = Router();

router.post('/sign-out', (_req: Request, res: Response) => {
  clearAuthCookie(res);
  return res.json({ message: 'Signed out' });
});

export default router;