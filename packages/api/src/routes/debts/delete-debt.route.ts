import { Request, Response, Router } from 'express';
import { debtsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    await debtsService.remove(req.user!.userId, req.params.id);
    return utilService.replyNoContent(res);
  }),
);

export default router;
