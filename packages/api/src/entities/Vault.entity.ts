import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User.entity';
import { BaseEntity } from './BaseEntity';

@Entity('vaults')
export class Vault extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  backgroundColor: string | null;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
