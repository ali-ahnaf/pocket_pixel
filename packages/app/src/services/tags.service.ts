import { CreateTagInput, UpdateTagInput } from '@expense-tracker/shared';
import { Tag } from '../entities/Tag.entity';
import { AppError } from '../errors/app-error';
import { TagsRepository } from '../repositories/tags.repository';
import { tagsRepository } from '../repositories';
import { logger } from '.';

export type { CreateTagInput, UpdateTagInput };

const TAG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedTags {
  tags: Tag[];
  expiresAt: number;
}

/**
 * Business logic for tags, including a short-lived per-user read cache. The
 * repository is injected (defaults to the shared singleton) so the service can
 * be unit-tested against a mock.
 */
export class TagsService {
  // Per-user in-memory cache. Reads serve from here until the TTL lapses;
  // mutations call `invalidateCache` so changes show up immediately.
  private readonly cache = new Map<string, CachedTags>();

  constructor(private readonly tags: TagsRepository = tagsRepository) {}

  list(userId: string): Promise<Tag[]> {
    return this.tags.findManyForUser(userId);
  }

  async listCached(userId: string): Promise<Tag[]> {
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tags;
    }

    const tags = await this.tags.findManyForUser(userId);
    this.cache.set(userId, { tags, expiresAt: Date.now() + TAG_CACHE_TTL_MS });
    return tags;
  }

  invalidateCache(userId: string): void {
    this.cache.delete(userId);
  }

  /** True when every id in `tagIds` belongs to the user. */
  async ensureUserTagsExist(userId: string, tagIds: string[]): Promise<boolean> {
    if (tagIds.length === 0) return true;
    const count = await this.tags.countForUser(userId, tagIds);
    return count === tagIds.length;
  }

  async create(userId: string, input: CreateTagInput): Promise<Tag> {
    const tag = this.tags.createEntity({
      userId,
      name: input.name,
      icon: input.icon ?? null,
      backgroundColor: input.backgroundColor ?? null,
    });
    const saved = await this.tags.save(tag);
    this.invalidateCache(userId);
    logger.info('Created tag', { userId, tagId: saved.id });
    return saved;
  }

  async update(userId: string, id: string, input: UpdateTagInput): Promise<Tag> {
    const tag = await this.tags.findOneForUser(userId, id);
    if (!tag) {
      throw new AppError('Tag not found', 404);
    }

    if (input.name !== undefined) tag.name = input.name;
    if (input.icon !== undefined) tag.icon = input.icon;
    if (input.backgroundColor !== undefined) tag.backgroundColor = input.backgroundColor;

    const saved = await this.tags.save(tag);
    this.invalidateCache(userId);
    logger.info('Updated tag', { userId, tagId: saved.id });
    return saved;
  }

  async remove(userId: string, id: string): Promise<void> {
    const tag = await this.tags.findOneForUser(userId, id);
    if (!tag) {
      throw new AppError('Tag not found', 404);
    }

    await this.tags.remove(tag);
    this.invalidateCache(userId);
    logger.info('Deleted tag', { userId, tagId: id });
  }
}
