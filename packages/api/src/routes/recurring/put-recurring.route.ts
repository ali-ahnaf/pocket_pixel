import { Request, Response, Router } from "express";
import Joi from "joi";
import { expensesRepo } from "./shared";

const router = Router({ mergeParams: true });

const updateRecurringSchema = Joi.object({
  title: Joi.string().max(200),
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid("expense", "income"),
  interval: Joi.string().valid("daily", "weekly", "monthly", "yearly"),
  startDate: Joi.string().isoDate().allow(null),
  endDate: Joi.string().isoDate().allow(null),
  tagId: Joi.string().uuid().allow(null),
  vaultId: Joi.string().uuid().allow(null),
}).min(1);

router.put("/:id", async (req: Request, res: Response) => {
  const { error, value } = updateRecurringSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const expense = await expensesRepo().findOneBy({
      id: req.params.id,
      userId: req.params.userId,
    });
    if (!expense) return res.status(404).json({ message: "Recurring quest not found" });

    Object.assign(expense, value);
    await expensesRepo().save(expense);
    const updated = await expensesRepo().findOne({
      where: { id: req.params.id },
      relations: ["tag"],
    });
    return res.json(updated);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
