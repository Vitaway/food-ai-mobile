import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity({ name: "user_sessions" })
export class UserSession {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid", name: "user_id" })
  userId!: string;

  @Column({ type: "varchar", name: "user_agent", nullable: true })
  userAgent!: string | null;

  @Column({ type: "varchar", nullable: true })
  ip!: string | null;

  @Column({ type: "timestamp", name: "revoked_at", nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
