import { Request, Response, Router } from "express";
import Joi from "joi";
import { asyncHandler } from "../../middleware/error-handler";
import { debtsRepo, expensesRepo } from "./shared";

const router = Router({ mergeParams: true });

const applyDebtSchema = Joi.object({
  vaultId: Joi.string().uuid().allow(null).optional(),
});

router.post("/:id/apply", asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = applyDebtSchema.validate(req.body ?? {});
  if (error) return res.status(400).json({ message: error.message });

  const debt = await debtsRepo().findOneBy({
    id: req.params.id,
    userId: req.params.userId,
  });
  if (!debt) return res.status(404).json({ message: "Due not found" });

  const date = new Date().toISOString().split("T")[0];

  const expense = expensesRepo().create({
    userId: req.params.userId,
    title: debt.title,
    amount: debt.amount,
    type: debt.type,
    date,
    vaultId: value.vaultId ?? null,
  });
  const saved = await expensesRepo().save(expense);

  await debtsRepo().remove(debt);

  return res.status(201).json({ id: (saved as any).id });
}));

export default router;
