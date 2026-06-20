import { Request, Response, Router } from 'express';
import { vaultsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await vaultsService.remove(req.user!.userId, req.params.id);
    return utilService.replyNoContent(res);
  }),
);

export default router;
