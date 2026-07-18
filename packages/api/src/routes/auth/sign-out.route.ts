import { Request, Response, Router } from 'express';
import { utilService } from '../../services';
import { clearAuthCookie } from './cookie-options';

const router = Router();

router.post('/sign-out', (_req: Request, res: Response) => {
  clearAuthCookie(res);
  return utilService.replyOk(res, { message: 'Signed out' });
});

export default router;