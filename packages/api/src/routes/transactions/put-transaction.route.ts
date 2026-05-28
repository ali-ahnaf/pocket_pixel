import { Request, Response, Router } from "express";
import Joi from "joi";
import { getCurrentTimeString, normalizeTransactionDateInput, transactionTimePattern, transactionsRepo, transactionTagsRepo } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });
const updateTransactionSchema = Joi.object({
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid("expense", "income"),
  title: Joi.string().max(200).allow(null, ""),
  date: Joi.string(),
  time: Joi.string().pattern(transactionTimePattern).allow(null),
  vaultId: Joi.string().uuid().allow(null),
  tagIds: Joi.array().items(Joi.string().uuid()),
}).min(1);

router.put("/:id", asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = updateTransactionSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const transaction = await transactionsRepo().findOneBy({
    id: req.params.id,
    userId: req.params.userId,
  });
  if (!transaction) return res.status(404).json({ message: "Transaction not found" });

  const { tagIds, date: providedDate, time: providedTime, ...transactionData } = value;
  const normalizedDate = normalizeTransactionDateInput(providedDate);
  if (providedDate && !normalizedDate.date) {
    return res.status(400).json({ message: 'date must be in YYYY-MM-DD or ISO-8601 format' });
  }

  Object.assign(transaction, transactionData);
  if (normalizedDate.date) {
    transaction.date = normalizedDate.date;
  }

  if (providedTime !== undefined) {
    transaction.time = providedTime;
  } else if (normalizedDate.time) {
    transaction.time = normalizedDate.time;
  } else if (!transaction.time && normalizedDate.date) {
    transaction.time = getCurrentTimeString();
  }

  transaction.updatedAt = new Date();
  const saved = await transactionsRepo().save(transaction);

  if (tagIds !== undefined) {
    await transactionTagsRepo().delete({ transactionId: saved.id });
    if (tagIds.length > 0) {
      const tags = tagIds.map((tagId: string) =>
        transactionTagsRepo().create({ transactionId: saved.id, tagId })
      );
      await transactionTagsRepo().save(tags);
    }
  }

  return res.json(saved);
}));

export default router;
