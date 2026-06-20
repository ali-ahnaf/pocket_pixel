import { Request, Response, Router } from 'express';
import { vaultsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.put(
  '/:id/set-default',
  asyncHandler(async (req: Request, res: Response) => {
    const vault = await vaultsService.setDefault(req.user!.userId, req.params.id);
    return utilService.replyOk(res, vault);
  }),
);

export default router;
