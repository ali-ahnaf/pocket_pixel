import { Request, Response, Router } from 'express';
import { utilService } from '../../services';

const router = Router();

router.get('/ping', (req: Request, res: Response) => {
  if (req.user) {
    return utilService.replyOk(res, { authenticated: true, user: req.user });
  }
  return utilService.replyOk(res, { authenticated: false });
});

export default router;
