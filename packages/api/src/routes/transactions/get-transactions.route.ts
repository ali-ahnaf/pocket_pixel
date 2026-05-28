import { Request, Response, Router } from "express";
import Joi from "joi";
import { buildTransactionDateRange, compareTransactionsByMomentDesc, transactionsRepo } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });
const transactionsQuerySchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
});

router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = transactionsQuerySchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });

  const transactions = await transactionsRepo().find({
    where: {
      userId: req.params.userId,
      date: buildTransactionDateRange(value.month, value.year),
    },
    relations: ["transactionTags", "transactionTags.tag", "vault"],
    order: { date: "DESC" },
  });

  const sortedTransactions = transactions.slice().sort(compareTransactionsByMomentDesc);

  const result = sortedTransactions.map((tx) => ({
    id: tx.id,
    userId: tx.userId,
    title: tx.title,
    amount: parseFloat(String(tx.amount)),
    type: tx.type,
    date: tx.date,
    time: tx.time,
    createdAt: tx.createdAt,
    vaultId: tx.vaultId,
    vault: tx.vault ? { id: tx.vault.id, name: tx.vault.name, icon: tx.vault.icon } : null,
    tags: tx.transactionTags?.map((tt) => tt.tag) ?? [],
  }));

  return res.json(result);
}));

export default router;
