import { Request, Response, Router } from "express";
import Joi from "joi";
import { buildTransactionDateRange, transactionsRepo } from "./shared";

const router = Router({ mergeParams: true });
const transactionsQuerySchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
});

router.get("/", async (req: Request, res: Response) => {
  const { error, value } = transactionsQuerySchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const transactions = await transactionsRepo().find({
      where: {
        userId: req.params.userId,
        date: buildTransactionDateRange(value.month, value.year),
      },
      order: { date: "DESC" },
    });

    return res.json(transactions);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
