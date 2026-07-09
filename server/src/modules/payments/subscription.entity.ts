import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "cancelled";
export type SubscriptionType = "individual" | "corporate" | "family";

@Entity({ name: "subscriptions" })
export class Subscription {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid", name: "user_id", nullable: true })
  userId!: string | null;

  @Index()
  @Column({ type: "varchar", name: "organization_id", length: 64, nullable: true })
  organizationId!: string | null;

  @Column({ type: "varchar", name: "plan_code", length: 64 })
  planCode!: string;

  @Column({ type: "varchar", name: "subscription_type", length: 24 })
  subscriptionType!: SubscriptionType;

  @Column({ type: "varchar", length: 24, default: "trialing" })
  status!: SubscriptionStatus;

  @Column({ type: "date", name: "renews_on", nullable: true })
  renewsOn!: string | null;

  @Column({ type: "date", name: "trial_ends_on", nullable: true })
  trialEndsOn!: string | null;

  @Column({ type: "jsonb", default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
