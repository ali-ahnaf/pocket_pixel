import { DataSource, Repository } from 'typeorm';
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

  findManyForUser(userId: string): Promise<Debt[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  findOneForUser(userId: string, id: string): Promise<Debt | null> {
    return this.repo.findOneBy({ userId, id });
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
