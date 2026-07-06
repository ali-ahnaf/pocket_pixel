import { DataSource, Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Debt } from '../entities/Debt.entity';

export class DebtsRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<Debt> {
    return this.dataSource.getRepository(Debt);
  }

  findManyForUser(userId: string, includeDeleted = false): Promise<Debt[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      withDeleted: includeDeleted,
    });
  }

  findOneForUser(userId: string, id: string, includeDeleted = false): Promise<Debt | null> {
    return this.repo.findOne({
      where: { userId, id },
      withDeleted: includeDeleted,
    });
  }

  createEntity(data: Partial<Debt>): Debt {
    return this.repo.create(data);
  }

  save(debt: Debt): Promise<Debt> {
    return this.repo.save(debt);
  }

  remove(debt: Debt): Promise<Debt> {
    return this.repo.softRemove(debt);
  }
}
