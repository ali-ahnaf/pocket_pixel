import { Request, Response, Router } from 'express';
import { usersService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router();

router.get(
  '/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.getById(req.user!.userId);
    return utilService.replyOk(res, user);
  }),
);

export default router;
