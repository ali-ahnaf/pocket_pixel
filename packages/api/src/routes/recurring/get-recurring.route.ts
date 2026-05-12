import { Request, Response, Router } from "express";
import { Not, IsNull } from "typeorm";
import { expensesRepo, recurringRelations, serializeRecurringExpense } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });

router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const quests = await expensesRepo().find({
    where: { userId: req.params.userId, interval: Not(IsNull()) },
    relations: [...recurringRelations],
    order: { title: "ASC" },
    withDeleted: false,
  });
  return res.json(quests.map(serializeRecurringExpense));
}));

export default router;
