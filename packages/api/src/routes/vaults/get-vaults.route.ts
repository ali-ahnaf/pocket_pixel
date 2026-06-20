import { Request, Response, Router } from 'express';
import { vaultsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const vaults = await vaultsService.list(req.user!.userId);
    return utilService.replyOk(res, vaults);
  }),
);

export default router;
