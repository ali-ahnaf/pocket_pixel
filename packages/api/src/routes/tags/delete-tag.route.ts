import { Request, Response, Router } from "express";
import { tagsRepo } from "./shared";

const router = Router({ mergeParams: true });

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const tag = await tagsRepo().findOneBy({
      id: req.params.id,
      userId: req.params.userId,
    });
    if (!tag) return res.status(404).json({ message: "Tag not found" });

    await tagsRepo().remove(tag);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
