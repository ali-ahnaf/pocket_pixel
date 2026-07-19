import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User.entity';
import { BaseEntity } from './BaseEntity';

/**
 * Per-user Google OAuth credentials. All `*Encrypted` columns hold
 * AES-256-GCM ciphertext (see `utils/oauth-credentials-encryption.util.ts`) —
 * never plaintext. Callers must encrypt before writing and decrypt after
 * reading; this entity/its repository only ever see already-encrypted strings.
 *
 * `googleClientId/SecretEncrypted` are the OAuth app the user brings (from
 * their own Google Cloud project). The `googleAccessToken/RefreshTokenEncrypted`
 * + `googleTokenExpiry` columns hold the tokens obtained after the user runs
 * the OAuth consent flow, and are null until Gmail is connected.
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

  @Column({ type: 'text', nullable: true })
  googleAccessTokenEncrypted: string | null;

  @Column({ type: 'text', nullable: true })
  googleRefreshTokenEncrypted: string | null;

  @Column({ type: 'datetime', nullable: true })
  googleTokenExpiry: Date | null;

  @Column({ type: 'varchar', nullable: true })
  googleEmail: string | null;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
