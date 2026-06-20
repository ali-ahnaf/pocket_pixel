import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Debt } from '../entities/Debt.entity';

/**
 * Data-access layer for debts (dues). The TypeORM repository is resolved lazily
 * per call so a different DataSource can be injected in tests.
 */
export class DebtsRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<Debt> {
    return this.dataSource.getRepository(Debt);
  }

  /** Base filter shared by every debt read: scope to the owning user. */
  private baseWhere(userId: string): FindOptionsWhere<Debt> {
    return { userId };
  }

  findManyForUser(userId: string): Promise<Debt[]> {
    return this.repo.find({ where: this.baseWhere(userId), order: { createdAt: 'DESC' } });
  }

  findOneForUser(userId: string, id: string): Promise<Debt | null> {
    return this.repo.findOneBy({ ...this.baseWhere(userId), id });
  }

  createEntity(data: Partial<Debt>): Debt {
    return this.repo.create(data);
  }

  save(debt: Debt): Promise<Debt> {
    return this.repo.save(debt);
  }

  remove(debt: Debt): Promise<Debt> {
    return this.repo.remove(debt);
  }
}
