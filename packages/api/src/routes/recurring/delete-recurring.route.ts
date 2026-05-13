import { Request, Response, Router } from "express";
import { expensesRepo } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";
import { cancelRecurring } from "../../scheduler/recurring-scheduler";

const router = Router({ mergeParams: true });

router.delete("/:id", asyncHandler(async (req: Request, res: Response) => {
  const expense = await expensesRepo().findOneBy({
    id: req.params.id,
    userId: req.params.userId,
  });
  if (!expense) return res.status(404).json({ message: "Recurring quest not found" });

  cancelRecurring(expense.id);
  await expensesRepo().remove(expense);
  return res.status(204).send();
}));

export default router;
