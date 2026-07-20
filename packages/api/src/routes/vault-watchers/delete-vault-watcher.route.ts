import { Request, Response, Router } from 'express';
import { vaultWatchersService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.delete(
  '/:vaultId',
  asyncHandler(async (req: Request, res: Response) => {
    await vaultWatchersService.remove(req.user!.userId, req.params.vaultId);
    return utilService.replyNoContent(res);
  }),
);

export default router;
