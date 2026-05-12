import { Request, Response, Router } from "express";
import Joi from "joi";
import { buildTransactionDateRange, transactionsRepo } from "./shared";
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
    order: { date: "DESC" },
  });

  return res.json(transactions);
}));

export default router;
