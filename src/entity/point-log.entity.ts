import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Point } from './point.entity';

export const TransactionConst = {
  CHARGE: 'CHARGE',
  USE: 'USE',
  REFUND: 'REFUND',
} as const;

export type Transaction =
  (typeof TransactionConst)[keyof typeof TransactionConst];

@Entity()
export class PointLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'varchar' })
  transaction: Transaction;

  @Column({ type: 'int' })
  beforeAmount: number;

  @Column({ type: 'int' })
  afterAmount: number;

  @CreateDateColumn({ type: 'timestamp' })
  createDate: Date;

  @ManyToOne(() => Point, (point) => point.logs, {
    createForeignKeyConstraints: false,
  })
  point: Point;
}
