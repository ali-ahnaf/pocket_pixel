import { Router } from 'express';
import getPendingExpensesRouter from './pending-expenses/get-pending-expenses.route';
import getPendingExpenseEmailRouter from './pending-expenses/get-pending-expense-email.route';
import deletePendingExpenseRouter from './pending-expenses/delete-pending-expense.route';

const router = Router({ mergeParams: true });

router.use(getPendingExpensesRouter);
router.use(getPendingExpenseEmailRouter);
router.use(deletePendingExpenseRouter);

export default router;
