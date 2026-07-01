import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity({ name: "admin_audit_logs" })
export class AdminAuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid", name: "admin_user_id" })
  adminUserId!: string;

  @Column({ type: "varchar", length: 64 })
  action!: string;

  @Column({ type: "varchar", name: "target_type", length: 64, nullable: true })
  targetType!: string | null;

  @Column({ type: "varchar", name: "target_id", length: 64, nullable: true })
  targetId!: string | null;

  @Column({ type: "jsonb", nullable: true })
  meta!: Record<string, unknown> | null;

  @Column({ type: "varchar", nullable: true })
  ip!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
