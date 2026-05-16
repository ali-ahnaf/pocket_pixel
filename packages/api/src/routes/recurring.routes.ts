import { Router } from "express";
import getRecurringRouter from "./recurring/get-recurring.route";
import getOccurrencesRouter from "./recurring/get-occurrences.route";
import postRecurringRouter from "./recurring/post-recurring.route";
import postApplyRouter from "./recurring/post-apply.route";
import postSkipRouter from "./recurring/post-skip.route";
import putRecurringRouter from "./recurring/put-recurring.route";
import deleteRecurringRouter from "./recurring/delete-recurring.route";

const router = Router({ mergeParams: true });

router.use(getOccurrencesRouter);
router.use(getRecurringRouter);
router.use(postApplyRouter);
router.use(postSkipRouter);
router.use(postRecurringRouter);
router.use(putRecurringRouter);
router.use(deleteRecurringRouter);

export default router;
