import { DataSource, Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { RefreshToken } from '../entities/refresh-token.entity';

export class RefreshTokensRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repo(): Repository<RefreshToken> {
    return this.dataSource.getRepository(RefreshToken);
  }

  findById(id: string): Promise<RefreshToken | null> {
    return this.repo.findOneBy({ id });
  }

  findByToken(token: string): Promise<RefreshToken | null> {
    return this.repo.findOneBy({ token });
  }

  createEntity(data: Partial<RefreshToken>): RefreshToken {
    return this.repo.create(data);
  }

  save(tokenEntity: RefreshToken): Promise<RefreshToken> {
    return this.repo.save(tokenEntity);
  }

  async revoke(id: string): Promise<void> {
    await this.repo.softDelete({ id });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repo.softDelete({ userId });
  }
}
