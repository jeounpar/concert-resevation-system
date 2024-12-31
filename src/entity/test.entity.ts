import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'test' })
export class TestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
  })
  public name: string;
}
