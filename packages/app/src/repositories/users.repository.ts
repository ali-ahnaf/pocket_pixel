import { DataSource, Repository } from 'typeorm';
import { AppDataSource } from '../db/data-source';
import { User } from '../entities/User.entity';
import { Vault } from '../entities/Vault.entity';

/**
 * Data-access layer for users. The TypeORM repository is resolved lazily per
 * call so the class can be constructed before the DataSource is initialized,
 * and so a different DataSource can be injected in tests.
 */
export class UsersRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<User> {
    return this.dataSource.getRepository(User);
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ email });
  }

  createEntity(data: Partial<User>): User {
    return this.repo.create(data);
  }

  save(user: User): Promise<User> {
    return this.repo.save(user);
  }

  /** Creates a user and their default "Main Stash" vault in one transaction, so a crash cannot leave a user without a vault. */
  createWithMainStash(data: Partial<User>): Promise<User> {
    return this.dataSource.transaction(async (em) => {
      const user = await em.save(em.create(User, data));
      await em.save(em.create(Vault, { userId: user.id, name: 'Main Stash', description: '', isDefault: true }));
      return user;
    });
  }
}
