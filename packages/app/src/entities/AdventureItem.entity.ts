import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User.entity';
import { Adventure } from './Adventure.entity';
import { BaseEntity } from './BaseEntity';

@Entity('adventure_items')
export class AdventureItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  adventureId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  plannedCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualCost: number | null;

  @Column({ type: 'boolean', default: false })
  isBought: boolean;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Adventure, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adventureId' })
  adventure: Adventure;
}
