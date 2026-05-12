import { Request, Response, Router } from "express";
import Joi from "joi";
import { transactionsRepo } from "./shared";

const router = Router({ mergeParams: true });
const updateTransactionSchema = Joi.object({
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid("expense", "income"),
  tag: Joi.string().max(100).allow(null, ""),
  title: Joi.string().max(200).allow(null, ""),
  date: Joi.string().isoDate(),
  vaultId: Joi.string().uuid().allow(null),
}).min(1);

router.put("/:id", async (req: Request, res: Response) => {
  const { error, value } = updateTransactionSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const transaction = await transactionsRepo().findOneBy({
      id: req.params.id,
      userId: req.params.userId,
    });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    Object.assign(transaction, value);
    const saved = await transactionsRepo().save(transaction);
    return res.json(saved);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
