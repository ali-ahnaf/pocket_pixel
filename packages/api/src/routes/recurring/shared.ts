import { In } from "typeorm";
import { AppDataSource } from "../../data-source";
import { Expense } from "../../entities/Expense.entity";
import { Tag } from "../../entities/Tag.entity";
import { TransactionTag } from "../../entities/TransactionTag.entity";

export const expensesRepo = () => AppDataSource.getRepository(Expense);
export const tagsRepo = () => AppDataSource.getRepository(Tag);
export const transactionTagsRepo = () => AppDataSource.getRepository(TransactionTag);

export const recurringRelations = ["transactionTags", "transactionTags.tag"] as const;

export function normalizeTagIds(tagIds?: string[] | null) {
  if (Array.isArray(tagIds)) {
    return [...new Set(tagIds.filter(Boolean))];
  }

  return [];
}

export async function ensureUserTagsExist(userId: string, tagIds: string[]) {
  if (tagIds.length === 0) return true;

  const count = await tagsRepo().count({
    where: {
      id: In(tagIds),
      userId,
    },
  });

  return count === tagIds.length;
}

export async function replaceTransactionTags(transactionId: string, tagIds: string[]) {
  await transactionTagsRepo().delete({ transactionId });

  if (tagIds.length === 0) return;

  await transactionTagsRepo().save(
    tagIds.map((tagId) => transactionTagsRepo().create({ transactionId, tagId })),
  );
}

export async function findRecurringExpense(id: string, userId: string) {
  return expensesRepo().findOne({
    where: { id, userId },
    relations: [...recurringRelations],
  });
}

export function serializeRecurringExpense(expense: Expense & { transactionTags?: TransactionTag[] }) {
  const transactionTags = expense.transactionTags ?? [];
  const tags = transactionTags
    .map((transactionTag) => transactionTag.tag)
    .filter((tag): tag is Tag => Boolean(tag));
  const tagIds = transactionTags.map((transactionTag) => transactionTag.tagId);

  return {
    ...expense,
    tagIds,
    tags,
  };
}
