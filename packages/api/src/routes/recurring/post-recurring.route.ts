import { Request, Response, Router } from "express";
import Joi from "joi";
import { Expense } from "../../entities/Expense.entity";
import { expensesRepo } from "./shared";

const router = Router({ mergeParams: true });

const createRecurringSchema = Joi.object({
  title: Joi.string().max(200).required(),
  amount: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid("expense", "income").default("expense"),
  interval: Joi.string().valid("daily", "weekly", "monthly", "yearly").required(),
  startDate: Joi.string().isoDate().optional().allow(null),
  endDate: Joi.string().isoDate().optional().allow(null),
  tagId: Joi.string().uuid().optional().allow(null),
  vaultId: Joi.string().uuid().optional().allow(null),
});

router.post("/", async (req: Request, res: Response) => {
  const { error, value } = createRecurringSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const expense = expensesRepo().create({ ...value, userId: req.params.userId });
    const saved = await expensesRepo().save(expense) as unknown as Expense;
    const withRelations = await expensesRepo().findOne({
      where: { id: saved.id },
      relations: ["tag"],
    });
    return res.status(201).json(withRelations);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
