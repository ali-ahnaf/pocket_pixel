import { Request, Response, Router } from "express";
import Joi from "joi";
import {
  ensureUserTagsExist,
  expensesRepo,
  findRecurringExpense,
  normalizeTagIds,
  replaceTransactionTags,
  serializeRecurringExpense,
} from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });

const updateRecurringSchema = Joi.object({
  title: Joi.string().max(200),
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid("expense", "income"),
  interval: Joi.string().valid("daily", "weekly", "monthly", "yearly"),
  startDate: Joi.string().isoDate().allow(null),
  endDate: Joi.string().isoDate().allow(null),
  tagIds: Joi.array().items(Joi.string().uuid()).unique().allow(null),
  vaultId: Joi.string().uuid().allow(null),
}).min(1);

router.put("/:id", asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = updateRecurringSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const expense = await expensesRepo().findOneBy({
    id: req.params.id,
    userId: req.params.userId,
  });
  if (!expense) return res.status(404).json({ message: "Recurring quest not found" });

  const shouldUpdateTags = "tagIds" in value;
  const tagIds = shouldUpdateTags ? normalizeTagIds(value.tagIds) : null;

  if (tagIds) {
    const hasValidTags = await ensureUserTagsExist(req.params.userId, tagIds);
    if (!hasValidTags) {
      return res.status(400).json({ message: "One or more tags are invalid" });
    }
  }

  Object.assign(expense, {
    title: value.title ?? expense.title,
    amount: value.amount ?? expense.amount,
    type: value.type ?? expense.type,
    interval: value.interval ?? expense.interval,
    startDate: value.startDate !== undefined ? value.startDate : expense.startDate,
    endDate: value.endDate !== undefined ? value.endDate : expense.endDate,
    vaultId: value.vaultId !== undefined ? value.vaultId : expense.vaultId,
  });
  await expensesRepo().save(expense);

  if (tagIds) {
    await replaceTransactionTags(expense.id, tagIds);
  }

  const updated = await findRecurringExpense(req.params.id, req.params.userId);
  return res.json(updated ? serializeRecurringExpense(updated) : null);
}));

export default router;
