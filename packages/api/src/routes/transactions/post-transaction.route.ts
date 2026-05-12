import { Request, Response, Router } from "express";
import Joi from "joi";
import { transactionsRepo } from "./shared";

const router = Router({ mergeParams: true });
const createTransactionSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid("expense", "income").default("expense"),
  tag: Joi.string().max(100).allow(null, "").optional(),
  title: Joi.string().max(200).allow(null, "").optional(),
  date: Joi.string().isoDate().required(),
  vaultId: Joi.string().uuid().allow(null).optional(),
});

router.post("/", async (req: Request, res: Response) => {
  const { error, value } = createTransactionSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const transaction = transactionsRepo().create({ ...value, userId: req.params.userId });
    const saved = await transactionsRepo().save(transaction);
    return res.status(201).json(saved);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
