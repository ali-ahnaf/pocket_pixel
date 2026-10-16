import { AppError } from '../errors/app-error';
import { BackupRepository, RestoreCounts } from '../repositories/backup.repository';
import { UsersRepository } from '../repositories/users.repository';
import { backupRepository, usersRepository } from '../repositories';
import { logger } from '.';

export type { RestoreCounts };

/**
 * Restores a SQLite backup (such as a copy of the API's pocket_pixel.sqlite) into the
 * device DB. The signed-in user's data is replaced by the backup user with the same
 * email, in one transaction. Repositories are injected so the service can be tested.
 */
export class BackupService {
  constructor(
    private readonly backups: BackupRepository = backupRepository,
    private readonly users: UsersRepository = usersRepository,
  ) {}

  /** Writes a copy of the device DB to `fileUri`, a local `file://` URI that must not exist yet. */
  async export(fileUri: string): Promise<void> {
    await this.backups.exportTo(toFilePath(fileUri));
    logger.info('Exported database');
  }

  /** `fileUri` is a local `file://` URI, as returned by the document picker. */
  async restore(userId: string, fileUri: string): Promise<RestoreCounts> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const counts = await this.backups.restoreUser(toFilePath(fileUri), user.email.toLowerCase(), userId);
    if (!counts) {
      throw new AppError(`This backup has no account for ${user.email}`, 404);
    }

    logger.info('Restored backup', { userId, ...counts });
    return counts;
  }
}

// SQLite wants a plain path, not a URI.
const toFilePath = (fileUri: string): string => decodeURIComponent(fileUri.replace(/^file:\/\//, ''));
