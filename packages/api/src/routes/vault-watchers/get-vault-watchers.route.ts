import { Request, Response, Router } from 'express';
import { VaultGmailWatcherDto } from '@expense-tracker/shared';
import { vaultWatchersService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const watchers: VaultGmailWatcherDto[] = await vaultWatchersService.listForUser(req.user!.userId);
    return utilService.replyOk(res, watchers);
  }),
);

export default router;
