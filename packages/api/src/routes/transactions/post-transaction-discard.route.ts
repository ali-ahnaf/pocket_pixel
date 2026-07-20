import { Request, Response, Router } from 'express';
import { transactionsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.post(
  '/:id/discard',
  asyncHandler(async (req: Request, res: Response) => {
    await transactionsService.discard(req.user!.userId, req.params.id);
    return utilService.replyNoContent(res);
  }),
);

export default router;
