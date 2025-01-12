import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConcertScheduleEntity } from './concert-schedule.entity';

export const SeatStatusConst = {
  EMPTY: 'EMPTY',
  RESERVED: 'RESERVED',
  PAID: 'PAID',
} as const;

export type SeatStatus = (typeof SeatStatusConst)[keyof typeof SeatStatusConst];

@Entity()
export class SeatEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @Column({ type: 'int' })
  concertScheduleId: number;

  @Column({ type: 'int' })
  seatNumber: number;

  @Column({ type: 'varchar' })
  status: SeatStatus;

  @Column({ type: 'int' })
  price: number;

  @CreateDateColumn({ type: 'timestamp' })
  createDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  expireDate: Date | null;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updateDate: Date | null;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleteDate: Date | null;

  @ManyToOne(() => ConcertScheduleEntity, (schedule) => schedule.seats, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'concert_schedule_id' })
  concertSchedule: ConcertScheduleEntity;
}
