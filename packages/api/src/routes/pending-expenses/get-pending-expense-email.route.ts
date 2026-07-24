import { Request, Response, Router } from 'express';
import { PendingExpenseEmailDto } from '@expense-tracker/shared';
import { pendingGmailExpenseService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.get(
  '/:id/email',
  asyncHandler(async (req: Request, res: Response) => {
    const email: PendingExpenseEmailDto = await pendingGmailExpenseService.getEmail(req.user!.userId, req.params.id);
    return utilService.replyOk(res, email);
  }),
);

export default router;
