import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type ReportPeriod = "weekly" | "monthly" | "custom";

@Entity({ name: "report_snapshots" })
export class ReportSnapshot {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", name: "scope_type", length: 24 })
  scopeType!: "consumer" | "coach" | "admin";

  @Index()
  @Column({ type: "varchar", name: "scope_id", length: 64 })
  scopeId!: string;

  @Column({ type: "varchar", length: 16 })
  period!: ReportPeriod;

  @Column({ type: "date", name: "period_start" })
  periodStart!: string;

  @Column({ type: "date", name: "period_end" })
  periodEnd!: string;

  @Column({ type: "jsonb", default: {} })
  metrics!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
