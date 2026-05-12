import { Request, Response, Router } from "express";
import { transactionsRepo } from "./shared";

const router = Router({ mergeParams: true });

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const transaction = await transactionsRepo().findOneBy({
      id: req.params.id,
      userId: req.params.userId,
    });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    await transactionsRepo().remove(transaction);
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
