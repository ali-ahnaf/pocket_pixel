import { Request, Response, Router } from 'express';
import { debtsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const debts = await debtsService.list(req.user!.userId);
    return utilService.replyOk(res, debts);
  }),
);

export default router;
