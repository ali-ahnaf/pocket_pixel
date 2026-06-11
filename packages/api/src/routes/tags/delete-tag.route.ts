import { Request, Response, Router } from "express";
import { tagsRepo, invalidateTagCache } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });

router.delete("/:id", asyncHandler(async (req: Request, res: Response) => {
  const tag = await tagsRepo().findOneBy({
    id: req.params.id,
    userId: req.params.userId,
  });
  if (!tag) return res.status(404).json({ message: "Tag not found" });

  await tagsRepo().remove(tag);
  invalidateTagCache(req.params.userId);
  return res.status(204).send();
}));

export default router;
