import { Request, Response, Router } from "express";
import Joi from "joi";
import { computeOccurrencesInMonth, expensesRepo, findRecurringExpense } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";
import { Expense } from "../../entities/Expense.entity";
import { TransactionTag } from "../../entities/TransactionTag.entity";
import { AppDataSource } from "../../data-source";
import { getCurrentTimeString } from "../transactions/shared";

const router = Router({ mergeParams: true });

const applySchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});

router.post("/:id/apply", asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = applySchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const quest = await findRecurringExpense(req.params.id, req.params.userId);
  if (!quest || !quest.interval) {
    return res.status(404).json({ message: "Recurring quest not found" });
  }

  const date: string = value.date;
  const [y, m] = date.split("-").map(Number);
  const validOccurrences = computeOccurrencesInMonth(
    quest.interval,
    quest.startDate,
    quest.endDate,
    y,
    m,
  );
  if (!validOccurrences.includes(date)) {
    return res.status(400).json({ message: "Date is not a valid occurrence for this quest" });
  }

  const existing = await expensesRepo().findOne({
    where: { userId: req.params.userId, sourceRecurringId: quest.id, date },
  });
  if (existing) {
    return res.status(409).json({ message: "Occurrence already applied" });
  }

  const now = new Date();
  const transaction = expensesRepo().create({
    userId: req.params.userId,
    title: quest.title,
    amount: quest.amount,
    type: quest.type,
    date,
    time: getCurrentTimeString(),
    createdAt: now,
    updatedAt: now,
    vaultId: quest.vaultId,
    sourceRecurringId: quest.id,
  });
  const saved = (await expensesRepo().save(transaction)) as unknown as Expense;

  const tagIds = (quest.transactionTags ?? []).map((tt) => tt.tagId);
  if (tagIds.length > 0) {
    const transactionTagsRepo = AppDataSource.getRepository(TransactionTag);
    await transactionTagsRepo.save(
      tagIds.map((tagId) => transactionTagsRepo.create({ transactionId: saved.id, tagId })),
    );
  }

  return res.status(201).json({ id: saved.id });
}));

export default router;
