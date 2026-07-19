import { Request, Response, Router } from 'express';
import { GmailLabelDto } from '@expense-tracker/shared';
import { gmailService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.get(
  '/gmail/labels',
  asyncHandler(async (req: Request, res: Response) => {
    const labels: GmailLabelDto[] = await gmailService.listLabels(req.user!.userId);
    return utilService.replyOk(res, labels);
  }),
);

export default router;
