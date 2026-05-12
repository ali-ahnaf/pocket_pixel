import { Router } from "express";
import getMonthlyAnalyticsRouter from "./analytics/get-monthly-analytics.route";
import getTagsAnalyticsRouter from "./analytics/get-tags-analytics.route";
import getYearlyAnalyticsRouter from "./analytics/get-yearly-analytics.route";

const router = Router({ mergeParams: true });

router.use(getTagsAnalyticsRouter);
router.use(getMonthlyAnalyticsRouter);
router.use(getYearlyAnalyticsRouter);

export default router;
