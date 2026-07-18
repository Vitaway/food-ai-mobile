import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "consumer_clinical_assessments" })
export class ConsumerClinicalAssessment {
  @PrimaryColumn({ name: "client_id", type: "varchar", length: 64 })
  clientId!: string;

  @Column({ type: "varchar", length: 16, default: "incomplete" })
  status!: "incomplete" | "draft" | "confirmed";

  @Column({ type: "jsonb", default: {} })
  data!: Record<string, unknown>;

  @Column({ name: "target_snapshot", type: "jsonb", nullable: true })
  targetSnapshot!: Record<string, unknown> | null;

  @Column({ name: "last_edited_by", type: "uuid", nullable: true })
  lastEditedBy!: string | null;

  @Column({ name: "confirmed_by", type: "uuid", nullable: true })
  confirmedBy!: string | null;

  @Column({ name: "confirmed_at", type: "timestamptz", nullable: true })
  confirmedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
