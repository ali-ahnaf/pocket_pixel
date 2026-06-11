import { AppDataSource } from "../../data-source";
import { Tag } from "../../entities/Tag.entity";

export const tagsRepo = () => AppDataSource.getRepository(Tag);

const TAG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedTags {
  tags: Tag[];
  expiresAt: number;
}

// Per-user in-memory cache of tags. Reads serve from here until the TTL
// lapses; mutations call invalidateTagCache so changes show up immediately.
const tagCache = new Map<string, CachedTags>();

export async function getCachedTags(userId: string): Promise<Tag[]> {
  const cached = tagCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tags;
  }

  const tags = await tagsRepo().find({
    where: { userId },
    order: { name: "ASC" },
  });

  tagCache.set(userId, { tags, expiresAt: Date.now() + TAG_CACHE_TTL_MS });
  return tags;
}

export function invalidateTagCache(userId: string): void {
  tagCache.delete(userId);
}
