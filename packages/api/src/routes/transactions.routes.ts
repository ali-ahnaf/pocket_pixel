import { Router } from 'express';
import deleteTransactionRouter from './transactions/delete-transaction.route';
import getTransactionsRouter from './transactions/get-transactions.route';
import postTransactionRouter from './transactions/post-transaction.route';
import postTransactionCommitRouter from './transactions/post-transaction-commit.route';
import postTransactionDiscardRouter from './transactions/post-transaction-discard.route';
import putTransactionRouter from './transactions/put-transaction.route';
import postTransferRoute from './transactions/post-transfer.route';

const router = Router({ mergeParams: true });

router.use(getTransactionsRouter);
router.use(postTransactionRouter);
router.use(postTransactionCommitRouter);
router.use(postTransactionDiscardRouter);
router.use(postTransferRoute);
router.use(putTransactionRouter);
router.use(deleteTransactionRouter);

export default router;
