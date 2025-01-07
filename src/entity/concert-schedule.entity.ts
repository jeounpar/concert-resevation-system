import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConcertEntity } from './concert.entity';
import { SeatEntity } from './seat.entity';

@Entity()
export class ConcertScheduleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  concertId: number;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @CreateDateColumn({ type: 'timestamp' })
  createDate: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updateDate: Date | null;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleteDate: Date | null;

  @ManyToOne(() => ConcertEntity, (concert) => concert.schedules, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'concert_id' })
  concert: ConcertEntity;

  @OneToMany(() => SeatEntity, (seat) => seat.concertSchedule, {
    createForeignKeyConstraints: false,
  })
  seats: SeatEntity[];
}
