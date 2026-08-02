import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "subscription_plans" })
export class SubscriptionPlan {
  @PrimaryColumn({ type: "varchar", length: 64 })
  code!: string;

  @Column({ type: "varchar", length: 120 })
  label!: string;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: "varchar", length: 3, default: "RWF" })
  currency!: string;

  @Column({ type: "varchar", name: "subscription_type", length: 24 })
  subscriptionType!: "individual" | "corporate" | "family";

  @Column({ type: "int", name: "interval_days", default: 30 })
  intervalDays!: number;

  @Column({ type: "boolean", name: "is_public", default: true })
  isPublic!: boolean;

  @Column({ type: "boolean", name: "is_active", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
