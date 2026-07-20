import { Request, Response, Router } from 'express';
import { transactionsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.post(
  '/:id/commit',
  asyncHandler(async (req: Request, res: Response) => {
    const saved = await transactionsService.commit(req.user!.userId, req.params.id);
    return utilService.replyOk(res, saved);
  }),
);

export default router;
