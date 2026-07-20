import { Request, Response, Router } from 'express';
import { GmailWatchStatusDto } from '@expense-tracker/shared';
import { gmailService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.get(
  '/gmail/watch',
  asyncHandler(async (req: Request, res: Response) => {
    const status: GmailWatchStatusDto = await gmailService.getWatchStatus(req.user!.userId);
    return utilService.replyOk(res, status);
  }),
);

export default router;
