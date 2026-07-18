import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User.entity';
import { BaseEntity } from './BaseEntity';

/**
 * Per-user Google OAuth client credentials. `googleClientIdEncrypted` and
 * `googleClientSecretEncrypted` hold AES-256-GCM ciphertext (see
 * `utils/oauth-credentials-encryption.util.ts`) — never plaintext. Callers
 * must encrypt before writing and decrypt after reading; this entity/its
 * repository only ever see already-encrypted strings.
 */
@Entity('user_oauth_credentials')
export class UserOAuthCredential extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  userId: string;

  @Column({ type: 'text' })
  googleClientIdEncrypted: string;

  @Column({ type: 'text' })
  googleClientSecretEncrypted: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
