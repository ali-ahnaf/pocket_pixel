import { Request, Response, Router } from 'express';
import Joi from 'joi';
import { Expense } from '../../entities/Expense.entity';
import { ensureUserTagsExist, expensesRepo, findRecurringExpense, normalizeTagIds, replaceTransactionTags, serializeRecurringExpense } from './shared';
import { asyncHandler } from '../../middleware/error-handler';
import { scheduleRecurring } from '../../scheduler/recurring-scheduler';

const router = Router({ mergeParams: true });

const createRecurringSchema = Joi.object({
  title: Joi.string().max(200).required(),
  amount: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid('expense', 'income').default('expense'),
  interval: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').required(),
  startDate: Joi.string().isoDate().required(),
  endDate: Joi.string().isoDate().optional().allow(null),
  tagIds: Joi.array().items(Joi.string().uuid()).unique().optional().allow(null),
  vaultId: Joi.string().uuid().optional().allow(null),
});

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = createRecurringSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const tagIds = normalizeTagIds(value.tagIds);
  const hasValidTags = await ensureUserTagsExist(req.params.userId, tagIds);
  if (!hasValidTags) {
    return res.status(400).json({ message: 'One or more tags are invalid' });
  }

  const startDate: string = value.startDate;
  const endDate: string = value.endDate ?? (() => {
    const d = new Date(startDate + 'T00:00:00');
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const expense = expensesRepo().create({
    title: value.title,
    amount: value.amount,
    type: value.type,
    interval: value.interval,
    startDate,
    endDate,
    vaultId: value.vaultId,
    userId: req.params.userId,
  });

  const saved = (await expensesRepo().save(expense)) as unknown as Expense;
  await replaceTransactionTags(saved.id, tagIds);

  scheduleRecurring(saved);

  const withRelations = await findRecurringExpense(saved.id, req.params.userId);
  return res.status(201).json(withRelations ? serializeRecurringExpense(withRelations) : null);
}));

export default router;
