import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConcertScheduleEntity } from './concert-schedule.entity';

@Entity()
export class ConcertEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn({ type: 'timestamp' })
  createDate: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updateDate: Date | null;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleteDate: Date | null;

  @OneToMany(() => ConcertScheduleEntity, (schedule) => schedule.concert, {
    createForeignKeyConstraints: false,
  })
  schedules: ConcertScheduleEntity[];
}
