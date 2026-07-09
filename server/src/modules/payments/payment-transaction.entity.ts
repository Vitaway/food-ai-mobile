import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type PaymentTransactionStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "refunded";

@Entity({ name: "payment_transactions" })
export class PaymentTransaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid", name: "subscription_id", nullable: true })
  subscriptionId!: string | null;

  @Index()
  @Column({ type: "varchar", name: "provider", length: 32, default: "irembopay" })
  provider!: string;

  @Index()
  @Column({ type: "varchar", name: "external_ref", length: 128, unique: true })
  externalRef!: string;

  @Column({ type: "varchar", name: "currency", length: 3, default: "RWF" })
  currency!: string;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: "varchar", length: 24, default: "pending" })
  status!: PaymentTransactionStatus;

  @Column({ type: "timestamptz", name: "processed_at", nullable: true })
  processedAt!: Date | null;

  @Column({ type: "jsonb", default: {} })
  payload!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
