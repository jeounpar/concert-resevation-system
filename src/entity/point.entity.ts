import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PointLogEntity } from './point-log.entity';

@Entity()
export class Point {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  remainPoint: number;

  @CreateDateColumn({ type: 'timestamp' })
  createDate: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updateDate: Date | null;

  @OneToMany(() => PointLogEntity, (pointLog) => pointLog.point, {
    createForeignKeyConstraints: false,
  })
  logs: PointLogEntity[];
}
