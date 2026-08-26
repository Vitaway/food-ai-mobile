import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export type FamilyInviteStatus = "pending" | "accepted" | "revoked" | "expired";

@Entity({ name: "family_subscription_invites" })
export class FamilySubscriptionInvite {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", name: "subscription_id" })
  subscriptionId!: string;

  @Column({ type: "uuid", name: "inviter_user_id" })
  inviterUserId!: string;

  @Column({ type: "varchar", length: 320 })
  email!: string;

  @Column({ type: "varchar", length: 128, name: "token_hash" })
  tokenHash!: string;

  @Column({ type: "varchar", length: 16, default: "pending" })
  status!: FamilyInviteStatus;

  @Column({ type: "timestamptz", name: "expires_at" })
  expiresAt!: Date;

  @Column({ type: "timestamptz", name: "accepted_at", nullable: true })
  acceptedAt!: Date | null;

  @Column({ type: "uuid", name: "accepted_user_id", nullable: true })
  acceptedUserId!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
