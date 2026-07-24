import { Request, Response, Router } from 'express';
import { pendingGmailExpenseService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await pendingGmailExpenseService.resolve(req.user!.userId, req.params.id);
    return utilService.replyNoContent(res);
  }),
);

export default router;
