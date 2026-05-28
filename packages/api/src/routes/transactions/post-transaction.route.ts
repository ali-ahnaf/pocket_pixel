import { Request, Response, Router } from "express";
import Joi from "joi";
import { getCurrentDateString, getCurrentTimeString, normalizeTransactionDateInput, transactionTimePattern, transactionsRepo, transactionTagsRepo } from "./shared";
import { Expense } from "../../entities/Expense.entity";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });
const createTransactionSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid("expense", "income").default("expense"),
  tagIds: Joi.array().items(Joi.string().uuid()).default([]),
  title: Joi.string().max(200).allow(null, "").optional(),
  vaultId: Joi.string().uuid().allow(null).optional(),
  date: Joi.string().optional(),
  time: Joi.string().pattern(transactionTimePattern).optional(),
});

router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = createTransactionSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const { tagIds, date: providedDate, time: providedTime, ...transactionData } = value;
  const normalizedDate = normalizeTransactionDateInput(providedDate);
  if (providedDate && !normalizedDate.date) {
    return res.status(400).json({ message: 'date must be in YYYY-MM-DD or ISO-8601 format' });
  }

  const now = new Date();
  const date = normalizedDate.date ?? getCurrentDateString(now);
  const time = providedTime ?? normalizedDate.time ?? getCurrentTimeString(now);

  const transaction = transactionsRepo().create({
    ...transactionData,
    userId: req.params.userId,
    date,
    time,
    createdAt: now,
    updatedAt: now,
  });
  const saved = await transactionsRepo().save(transaction) as unknown as Expense;

  if (tagIds.length > 0) {
    const tags = tagIds.map((tagId: string) =>
      transactionTagsRepo().create({ transactionId: saved.id, tagId })
    );
    await transactionTagsRepo().save(tags);
  }

  return res.status(201).json(saved);
}));

export default router;
