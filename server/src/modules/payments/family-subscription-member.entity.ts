import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export type FamilyMemberRole = "payer" | "member";

@Entity({ name: "family_subscription_members" })
export class FamilySubscriptionMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "subscription_id" })
  subscriptionId!: string;

  @Column({ type: "uuid", name: "user_id" })
  userId!: string;

  @Column({ type: "varchar", length: 16, default: "member" })
  role!: FamilyMemberRole;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
