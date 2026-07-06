import { DataSource, FindManyOptions, IsNull, Not, Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Debt } from '../entities/Debt.entity';

export class DebtsRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<Debt> {
    return this.dataSource.getRepository(Debt);
  }

  findManyForUser(userId: string, statusOrFlag: 'incomplete' | 'completed' | 'all' | boolean = 'incomplete'): Promise<Debt[]> {
    const options: FindManyOptions<Debt> = { where: { userId }, order: { createdAt: 'DESC' } };

    if (statusOrFlag === 'completed' || statusOrFlag === true) {
      options.where = statusOrFlag === 'completed' ? { userId, deletedAt: Not(IsNull()) } : { userId };
      options.withDeleted = true;
    } else if (statusOrFlag === 'all') {
      options.withDeleted = true;
    }

    return this.repo.find(options);
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