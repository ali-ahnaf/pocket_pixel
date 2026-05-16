import { Request, Response, Router } from "express";
import Joi from "joi";
import { computeOccurrencesInMonth, findRecurringExpense, occurrenceSkipsRepo } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";

const router = Router({ mergeParams: true });

const skipSchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});

router.post("/:id/skip", asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = skipSchema.validate(req.body);
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

  const repo = occurrenceSkipsRepo();
  const existing = await repo.findOne({ where: { recurringId: quest.id, date } });
  if (!existing) {
    await repo.save(repo.create({ recurringId: quest.id, date, userId: req.params.userId }));
  }

  return res.status(204).send();
}));

export default router;
