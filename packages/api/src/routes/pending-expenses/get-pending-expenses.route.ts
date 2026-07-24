import { Request, Response, Router } from 'express';
import { PendingGmailExpenseDto } from '@expense-tracker/shared';
import { pendingGmailExpenseService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const pending: PendingGmailExpenseDto[] = await pendingGmailExpenseService.list(req.user!.userId);
    return utilService.replyOk(res, pending);
  }),
);

export default router;
