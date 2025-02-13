import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

export const TokenStatusConst = {
  WAIT: 'WAIT',
  ACTIVE: 'ACTIVE',
} as const;

export type TokenStatus =
  (typeof TokenStatusConst)[keyof typeof TokenStatusConst];

@Entity()
export class TokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('token_entity_user_id')
  @Column({ type: 'int' })
  userId: number;

  @Index('token_entity_token_value')
  @Column({ type: 'varchar' })
  tokenValue: string;

  @Column({ type: 'timestamp' })
  issuedDate: Date;

  @Column({ type: 'timestamp' })
  expiredDate: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleteDate: Date;

  @Column({ type: 'varchar' })
  status: TokenStatus;

  @ManyToOne(() => UserEntity, (user) => user.id, {
    createForeignKeyConstraints: false,
  })
  user: UserEntity;
}
