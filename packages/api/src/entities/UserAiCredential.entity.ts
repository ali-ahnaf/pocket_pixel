import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User.entity';
import { BaseEntity } from './BaseEntity';

/**
 * Per-user, E2E-encrypted OpenRouter API key. The server only ever stores and
 * returns opaque ciphertext blobs — it never sees the plaintext key.
 *
 * Envelope scheme: the browser generates a random DEK, encrypts the OpenRouter
 * key with it (`keyIv` + `keyCiphertext`), derives a KEK from the user's login
 * password via PBKDF2 (`salt` + `kdfIterations`), and wraps the DEK with that
 * KEK (`dekIv` + `wrappedDek`). None of `salt`, `dekIv`, `wrappedDek`, `keyIv`,
 * `keyCiphertext` are decryptable server-side.
 */
@Entity('user_ai_credentials')
export class UserAiCredential extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  userId: string;

  @Column({ type: 'varchar' })
  salt: string;

  @Column({ type: 'int' })
  kdfIterations: number;

  @Column({ type: 'varchar' })
  dekIv: string;

  @Column({ type: 'text' })
  wrappedDek: string;

  @Column({ type: 'varchar' })
  keyIv: string;

  @Column({ type: 'text' })
  keyCiphertext: string;

  @Column({ type: 'varchar', nullable: true })
  selectedModel: string | null;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
