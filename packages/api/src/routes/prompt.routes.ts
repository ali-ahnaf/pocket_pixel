import { Router } from "express";
import postPromptRouter from "./prompt/post-prompt.route";
import getUsageRouter from "./prompt/get-usage.route";

const router = Router({ mergeParams: true });

router.use(postPromptRouter);
router.use(getUsageRouter);

export default router;
