import { Router } from 'express';
import getDebtsRouter from './debts/get-debts.route';
import postDebtRouter from './debts/post-debt.route';
import postApplyRouter from './debts/post-apply.route';
import deleteDebtRouter from './debts/delete-debt.route';

const router = Router({ mergeParams: true });

router.use(getDebtsRouter);
router.use(postApplyRouter);
router.use(postDebtRouter);
router.use(deleteDebtRouter);

export default router;
