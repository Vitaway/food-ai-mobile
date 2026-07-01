import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "consumer_profiles" })
export class ConsumerProfile {
  @PrimaryColumn({ type: "varchar", length: 64 })
  id!: string;

  @Column({ type: "jsonb" })
  profile!: Record<string, unknown>;

  @Column({ type: "jsonb" })
  dashboard!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
