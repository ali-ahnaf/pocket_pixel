import { Request, Response, Router } from "express";
import Joi from "joi";
import { asyncHandler } from "../../middleware/error-handler";
import { debtsRepo, serializeDebt } from "./shared";

const router = Router({ mergeParams: true });

const createDebtSchema = Joi.object({
  title: Joi.string().max(200).required(),
  amount: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid("expense", "income").default("expense"),
});

router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = createDebtSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const debt = debtsRepo().create({
    title: value.title,
    amount: value.amount,
    type: value.type,
    userId: req.params.userId,
  });

  const saved = await debtsRepo().save(debt);
  return res.status(201).json(serializeDebt(saved));
}));

export default router;
