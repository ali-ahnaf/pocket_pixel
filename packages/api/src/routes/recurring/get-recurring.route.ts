import { Request, Response, Router } from "express";
import { Not, IsNull } from "typeorm";
import { expensesRepo } from "./shared";

const router = Router({ mergeParams: true });

router.get("/", async (req: Request, res: Response) => {
  try {
    const quests = await expensesRepo().find({
      where: { userId: req.params.userId, interval: Not(IsNull()) },
      relations: ["tag"],
      order: { title: "ASC" },
      withDeleted: false,
    });
    return res.json(quests);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
