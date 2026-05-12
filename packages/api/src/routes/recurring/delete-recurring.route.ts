import { Request, Response, Router } from "express";
import { expensesRepo } from "./shared";

const router = Router({ mergeParams: true });

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const expense = await expensesRepo().findOneBy({
      id: req.params.id,
      userId: req.params.userId,
    });
    if (!expense) return res.status(404).json({ message: "Recurring quest not found" });

    await expensesRepo().remove(expense);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
