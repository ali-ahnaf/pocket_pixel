import { Request, Response, Router } from 'express';
import { debtsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const DEBT_STATUSES = ['incomplete', 'completed', 'all'] as const;

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const queryStatus = req.query.status as string;
    const status = DEBT_STATUSES.includes(queryStatus as any) ? (queryStatus as 'incomplete' | 'completed' | 'all') : 'incomplete';
    
    const debts = await debtsService.list(req.user!.userId, status);
    return utilService.replyOk(res, debts);
  }),
);

export default router;