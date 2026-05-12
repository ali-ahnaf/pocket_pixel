import { Router } from "express";
import getTagsRouter from "./tags/get-tags.route";
import postTagRouter from "./tags/post-tag.route";
import putTagRouter from "./tags/put-tag.route";
import deleteTagRouter from "./tags/delete-tag.route";

const router = Router({ mergeParams: true });

router.use(getTagsRouter);
router.use(postTagRouter);
router.use(putTagRouter);
router.use(deleteTagRouter);

export default router;
