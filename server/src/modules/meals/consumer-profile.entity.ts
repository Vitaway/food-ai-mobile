import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity({ name: "consumer_profiles" })
export class ConsumerProfile {
  /** Vitaway patient file ID (e.g. VTW-7K2M9X4Q) */
  @PrimaryColumn({ type: "varchar", length: 64 })
  id!: string;

  @Index({ unique: true })
  @Column({ type: "uuid", name: "user_id", nullable: true })
  userId!: string | null;

  @Column({ type: "jsonb" })
  profile!: Record<string, unknown>;

  @Column({ type: "jsonb" })
  dashboard!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
