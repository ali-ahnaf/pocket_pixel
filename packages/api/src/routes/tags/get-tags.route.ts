import { Request, Response, Router } from "express";
import { tagsRepo } from "./shared";

const router = Router({ mergeParams: true });

router.get("/", async (req: Request, res: Response) => {
  try {
    const tags = await tagsRepo().find({
      where: { userId: req.params.userId },
      order: { name: "ASC" },
    });
    return res.json(tags);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
