import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConcertEntity } from './concert.entity';
import { SeatEntity } from './seat.entity';

@Entity()
@Index('concert_schedule_index', ['concertId', 'theDateString'])
export class ConcertScheduleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('concert_schedule_concert_id')
  @Column({ type: 'int' })
  concertId: number;

  @Column({ type: 'varchar' })
  theDateString: string;

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
