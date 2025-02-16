import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export const OutboxStatusConst = {
  INIT: 'INIT',
  PUBLISHED: 'PUBLISHED',
} as const;

export type OutboxStatus =
  (typeof OutboxStatusConst)[keyof typeof OutboxStatusConst];

@Entity()
export class OutboxEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'json' })
  payload: any;

  @Column({ type: 'varchar' })
  status: OutboxStatus;

  @CreateDateColumn({ type: 'timestamp' })
  createDate: Date;
}
