import { Request, Response, Router } from "express";
import Joi from "joi";
import { FindOptionsWhere, IsNull, Not } from "typeorm";
import { Expense } from "../../entities/Expense.entity";
import { buildTransactionDateRange, transactionsRepo } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });
const transactionsQuerySchema = Joi.object({
  month: Joi.number().integer().min(1).max(12),
  year: Joi.number().integer().min(2000).max(2100),
  period: Joi.string().valid("all"),
});

router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = transactionsQuerySchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });

  const isAllTime = value.period === "all";
  if (!isAllTime && (!value.month || !value.year)) {
    return res.status(400).json({ message: "month and year are required unless period=all" });
  }

  const where: FindOptionsWhere<Expense> = { userId: req.params.userId, interval: IsNull() };
  if (!isAllTime) {
    where.date = buildTransactionDateRange(value.month, value.year);
  } else {
    where.date = Not(IsNull());
  }

  const transactions = await transactionsRepo().find({
    where,
    relations: ["transactionTags", "transactionTags.tag", "vault"],
    order: { updatedAt: "DESC" },
  });

  const result = transactions.map((tx) => ({
    id: tx.id,
    userId: tx.userId,
    title: tx.title,
    amount: parseFloat(String(tx.amount)),
    type: tx.type,
    date: tx.date,
    vaultId: tx.vaultId,
    vault: tx.vault ? { id: tx.vault.id, name: tx.vault.name, icon: tx.vault.icon } : null,
    tags: tx.transactionTags?.map((tt) => tt.tag) ?? [],
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
  }));

  return res.json(result);
}));

export default router;
