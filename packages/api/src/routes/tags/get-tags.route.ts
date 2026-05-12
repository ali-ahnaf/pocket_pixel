import { Request, Response, Router } from "express";
import { tagsRepo } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });

router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const tags = await tagsRepo().find({
    where: { userId: req.params.userId },
    order: { name: "ASC" },
  });
  return res.json(tags);
}));

export default router;
