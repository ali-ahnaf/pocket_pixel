import { DataSource, In, Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Tag } from '../entities/Tag.entity';

/**
 * Data-access layer for tags. The TypeORM repository is resolved lazily per
 * call so a different DataSource can be injected in tests.
 */
export class TagsRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<Tag> {
    return this.dataSource.getRepository(Tag);
  }

  findManyForUser(userId: string): Promise<Tag[]> {
    return this.repo.find({ where: { userId }, order: { name: 'ASC' } });
  }

  findOneForUser(userId: string, id: string): Promise<Tag | null> {
    return this.repo.findOneBy({ userId, id });
  }

  countForUser(userId: string, ids: string[]): Promise<number> {
    return this.repo.count({ where: { userId, id: In(ids) } });
  }

  createEntity(data: Partial<Tag>): Tag {
    return this.repo.create(data);
  }

  save(tag: Tag): Promise<Tag> {
    return this.repo.save(tag);
  }

  remove(tag: Tag): Promise<Tag> {
    return this.repo.remove(tag);
  }
}
