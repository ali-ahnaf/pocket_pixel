import { Router } from 'express';
import deleteTransactionRouter from './transactions/delete-transaction.route';
import getTransactionsRouter from './transactions/get-transactions.route';
import postTransactionRouter from './transactions/post-transaction.route';
import putTransactionRouter from './transactions/put-transaction.route';

const router = Router({ mergeParams: true });

router.use(getTransactionsRouter);
router.use(postTransactionRouter);
router.use(putTransactionRouter);
router.use(deleteTransactionRouter);

export default router;
