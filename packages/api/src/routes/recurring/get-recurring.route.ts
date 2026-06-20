import { Request, Response, Router } from 'express';
import { recurringService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const quests = await recurringService.list(req.user!.userId);
    return utilService.replyOk(res, quests);
  }),
);

export default router;
