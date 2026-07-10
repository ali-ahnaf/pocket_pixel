import { Request, Response, Router } from 'express';
import { DebtStatus } from '@expense-tracker/shared';
import { debtsService, utilService } from '../../services';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router({ mergeParams: true });

const DEBT_STATUSES: readonly DebtStatus[] = ['incomplete', 'completed', 'all'];

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const status = DEBT_STATUSES.includes(req.query.status as DebtStatus) ? (req.query.status as DebtStatus) : 'incomplete';
    const debts = await debtsService.list(req.user!.userId, status);
    return utilService.replyOk(res, debts);
  }),
);

export default router;
