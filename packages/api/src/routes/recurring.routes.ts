import { Router } from "express";
import getRecurringRouter from "./recurring/get-recurring.route";
import postRecurringRouter from "./recurring/post-recurring.route";
import putRecurringRouter from "./recurring/put-recurring.route";
import deleteRecurringRouter from "./recurring/delete-recurring.route";

const router = Router({ mergeParams: true });

router.use(getRecurringRouter);
router.use(postRecurringRouter);
router.use(putRecurringRouter);
router.use(deleteRecurringRouter);

export default router;
