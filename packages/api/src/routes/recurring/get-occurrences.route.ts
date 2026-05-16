import { Request, Response, Router } from "express";
import { In, IsNull, Not } from "typeorm";
import Joi from "joi";
import { computeOccurrencesInMonth, expensesRepo, occurrenceSkipsRepo, recurringRelations } from "./shared";
import { asyncHandler } from "../../middleware/error-handler";
import { Tag } from "../../entities/Tag.entity";

const router = Router({ mergeParams: true });

const occurrencesQuerySchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
});

router.get("/occurrences", asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = occurrencesQuerySchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });

  const { month, year } = value as { month: number; year: number };

  const quests = await expensesRepo().find({
    where: { userId: req.params.userId, interval: Not(IsNull()), deletedAt: IsNull() },
    relations: [...recurringRelations],
  });

  if (quests.length === 0) return res.json([]);

  const questIds = quests.map((q) => q.id);
  const applied = await expensesRepo().find({
    where: {
      userId: req.params.userId,
      sourceRecurringId: In(questIds),
      date: Not(IsNull()),
    },
    select: ["sourceRecurringId", "date"],
  });

  const appliedSet = new Set<string>();
  for (const tx of applied) {
    appliedSet.add(`${tx.sourceRecurringId}:${tx.date}`);
  }

  const skips = await occurrenceSkipsRepo().find({
    where: { userId: req.params.userId, recurringId: In(questIds) },
  });
  for (const skip of skips) {
    appliedSet.add(`${skip.recurringId}:${skip.date}`);
  }

  const result: Array<{
    recurringId: string;
    date: string;
    title: string | null;
    amount: number;
    type: string;
    vaultId: string | null;
    vault: { id: string; name: string; icon: string | null } | null;
    tags: Tag[];
  }> = [];

  for (const quest of quests) {
    const occurrences = computeOccurrencesInMonth(
      quest.interval,
      quest.startDate,
      quest.endDate,
      year,
      month,
    );
    const tags = (quest.transactionTags ?? [])
      .map((tt) => tt.tag)
      .filter((t): t is Tag => Boolean(t));
    for (const date of occurrences) {
      if (appliedSet.has(`${quest.id}:${date}`)) continue;
      result.push({
        recurringId: quest.id,
        date,
        title: quest.title,
        amount: parseFloat(String(quest.amount)),
        type: quest.type,
        vaultId: quest.vaultId,
        vault: quest.vault
          ? { id: quest.vault.id, name: quest.vault.name, icon: quest.vault.icon }
          : null,
        tags,
      });
    }
  }

  result.sort((a, b) => a.date.localeCompare(b.date));
  return res.json(result);
}));

export default router;
