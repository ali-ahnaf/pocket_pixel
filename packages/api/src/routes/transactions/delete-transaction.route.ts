import { Request, Response, Router } from "express";
import { transactionsRepo } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });

router.delete("/:id", asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionsRepo().findOneBy({
    id: req.params.id,
    userId: req.params.userId,
  });
  if (!transaction) return res.status(404).json({ message: "Transaction not found" });

  await transactionsRepo().remove(transaction);
  return res.status(204).send();
}));

export default router;
