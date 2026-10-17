import { CreateAdventureInput, UpdateAdventureInput, CreateAdventureItemInput, UpdateAdventureItemInput, AdventureDto, AdventureItemDto } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import type { Adventure } from '../entities/Adventure.entity';
import type { AdventureItem } from '../entities/AdventureItem.entity';
import { toIsoDate } from '../lib/formatters';
import { AdventuresRepository } from '../repositories/adventures.repository';
import { adventuresRepository } from '../repositories';
import { logger } from '.';

export type { CreateAdventureInput, UpdateAdventureInput, CreateAdventureItemInput, UpdateAdventureItemInput, AdventureDto, AdventureItemDto };

const COMPLETE_MESSAGE = 'This quest is complete. Reopen it to change items.';

/** The UI blocks negative amounts already; this guards the service boundary. */
function assertNotNegative(...amounts: (number | null | undefined)[]): void {
  if (amounts.some((amount) => amount != null && amount < 0)) {
    throw new AppError('Amounts cannot be negative', 400);
  }
}

/** A name that trims to nothing would save a blank row; the UI blocks it already. */
function assertNamed(name: string | undefined): void {
  if (name !== undefined && name.trim().length === 0) {
    throw new AppError('Name is required', 400);
  }
}

/**
 * Business logic for adventures (one-off trip and event planning) and their
 * checklist items. Repositories are injected (default to the shared singleton)
 * so the service can be unit-tested.
 */
export class AdventuresService {
  constructor(private readonly adventures: AdventuresRepository = adventuresRepository) {}

  async list(userId: string, today: Date = new Date()): Promise<AdventureDto[]> {
    const rows = await this.adventures.findManyWithTotals(userId, toIsoDate(today));
    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      name: row.name,
      flavorText: row.flavorText ?? null,
      fund: row.fund == null ? null : Number(row.fund),
      startDate: row.startDate ?? null,
      endDate: row.endDate ?? null,
      completedAt: row.completedAt ?? null,
      isComplete: Number(row.isComplete) === 1,
      plannedTotal: Number(row.plannedTotal),
      spent: Number(row.spent),
      itemCount: Number(row.itemCount),
      boughtCount: Number(row.boughtCount),
    }));
  }

  async get(userId: string, id: string, today: Date = new Date()): Promise<AdventureDto> {
    const row = await this.adventures.findOneWithTotals(userId, id, toIsoDate(today));
    if (!row) {
      throw new AppError('Adventure not found', 404);
    }
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      flavorText: row.flavorText ?? null,
      fund: row.fund == null ? null : Number(row.fund),
      startDate: row.startDate ?? null,
      endDate: row.endDate ?? null,
      completedAt: row.completedAt ?? null,
      isComplete: Number(row.isComplete) === 1,
      plannedTotal: Number(row.plannedTotal),
      spent: Number(row.spent),
      itemCount: Number(row.itemCount),
      boughtCount: Number(row.boughtCount),
    };
  }

  async create(userId: string, input: CreateAdventureInput): Promise<{ id: string }> {
    assertNamed(input.name);
    assertNotNegative(input.fund);
    const adventure = this.adventures.createAdventure({
      userId,
      name: input.name.trim(),
      flavorText: input.flavorText ?? null,
      fund: input.fund ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
    });
    const saved = await this.adventures.saveAdventure(adventure);
    logger.info('Created adventure', { userId, adventureId: saved.id });
    return { id: saved.id };
  }

  /** Allowed while complete: an adventure completed by its end date is reopened by editing that date. */
  async update(userId: string, id: string, input: UpdateAdventureInput): Promise<void> {
    assertNamed(input.name);
    assertNotNegative(input.fund);
    const adventure = await this.findOrThrow(userId, id);

    if (input.name !== undefined) adventure.name = input.name.trim();
    if (input.flavorText !== undefined) adventure.flavorText = input.flavorText;
    if (input.fund !== undefined) adventure.fund = input.fund;
    if (input.startDate !== undefined) adventure.startDate = input.startDate;
    if (input.endDate !== undefined) adventure.endDate = input.endDate;

    await this.adventures.saveAdventure(adventure);
    logger.info('Updated adventure', { userId, adventureId: id });
  }

  async complete(userId: string, id: string): Promise<void> {
    const adventure = await this.findOrThrow(userId, id);
    adventure.completedAt = new Date();
    await this.adventures.saveAdventure(adventure);
    logger.info('Completed adventure', { userId, adventureId: id });
  }

  async reopen(userId: string, id: string): Promise<void> {
    const adventure = await this.findOrThrow(userId, id);
    adventure.completedAt = null;
    await this.adventures.saveAdventure(adventure);
    logger.info('Reopened adventure', { userId, adventureId: id });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOrThrow(userId, id);
    await this.adventures.softRemoveWithItems(userId, id);
    logger.info('Deleted adventure', { userId, adventureId: id });
  }

  async listItems(userId: string, adventureId: string): Promise<AdventureItemDto[]> {
    const items = await this.adventures.findItems(userId, adventureId);
    return items.map((item) => ({
      id: item.id,
      adventureId: item.adventureId,
      name: item.name,
      plannedCost: Number(item.plannedCost),
      actualCost: item.actualCost == null ? null : Number(item.actualCost),
      isBought: item.isBought,
      sortOrder: item.sortOrder,
    }));
  }

  async addItem(userId: string, adventureId: string, input: CreateAdventureItemInput, today: Date = new Date()): Promise<{ id: string }> {
    assertNamed(input.name);
    assertNotNegative(input.plannedCost);
    await this.assertEditable(userId, adventureId, today);
    const item = this.adventures.createItem({
      userId,
      adventureId,
      name: input.name.trim(),
      plannedCost: input.plannedCost,
      sortOrder: await this.adventures.nextSortOrder(userId, adventureId),
    });
    const saved = await this.adventures.saveItem(item);
    logger.info('Added adventure item', { userId, adventureId, itemId: saved.id });
    return { id: saved.id };
  }

  async updateItem(userId: string, itemId: string, input: UpdateAdventureItemInput, today: Date = new Date()): Promise<void> {
    assertNamed(input.name);
    assertNotNegative(input.plannedCost, input.actualCost);
    const item = await this.findItemOrThrow(userId, itemId);
    await this.assertEditable(userId, item.adventureId, today);

    if (input.name !== undefined) item.name = input.name.trim();
    if (input.plannedCost !== undefined) item.plannedCost = input.plannedCost;
    if (input.isBought === true) {
      item.isBought = true;
      item.actualCost = input.actualCost ?? Number(item.plannedCost);
    } else if (input.isBought === false) {
      item.isBought = false;
      item.actualCost = null;
    } else if (input.actualCost !== undefined && item.isBought) {
      // Only a bought item carries an actual cost.
      item.actualCost = input.actualCost ?? Number(item.plannedCost);
    }

    await this.adventures.saveItem(item);
    logger.info('Updated adventure item', { userId, itemId });
  }

  async removeItem(userId: string, itemId: string, today: Date = new Date()): Promise<void> {
    const item = await this.findItemOrThrow(userId, itemId);
    await this.assertEditable(userId, item.adventureId, today);
    await this.adventures.removeItem(item);
    logger.info('Removed adventure item', { userId, itemId });
  }

  private async findOrThrow(userId: string, id: string): Promise<Adventure> {
    const adventure = await this.adventures.findOneForUser(userId, id);
    if (!adventure) {
      throw new AppError('Adventure not found', 404);
    }
    return adventure;
  }

  private async findItemOrThrow(userId: string, itemId: string): Promise<AdventureItem> {
    const item = await this.adventures.findItemForUser(userId, itemId);
    if (!item) {
      throw new AppError('Item not found', 404);
    }
    return item;
  }

  private async assertEditable(userId: string, adventureId: string, today: Date): Promise<void> {
    const adventure = await this.get(userId, adventureId, today);
    if (adventure.isComplete) {
      throw new AppError(COMPLETE_MESSAGE, 409);
    }
  }
}
