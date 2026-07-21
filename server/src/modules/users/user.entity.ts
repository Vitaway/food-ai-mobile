import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import type { UserRole } from "../../middlewares/auth.middleware";

export type MembershipTier = "standard" | "pro";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", name: "password_hash", length: 255 })
  passwordHash!: string;

  @Column({ type: "varchar", length: 32, default: "coach" })
  role!: UserRole;

  @Column({ type: "varchar", name: "display_name", length: 255 })
  displayName!: string;

  @Column({ type: "varchar", name: "avatar_url", length: 512, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  phone!: string | null;

  @Column({ type: "boolean", name: "is_active", default: true })
  isActive!: boolean;

  @Index({ unique: true })
  @Column({ type: "varchar", name: "referral_code", length: 16, nullable: true })
  referralCode!: string | null;

  @Column({ type: "uuid", name: "referred_by_user_id", nullable: true })
  referredByUserId!: string | null;

  @Column({ type: "varchar", name: "registration_source", length: 32, nullable: true })
  registrationSource!: string | null;

  @Index()
  @Column({ type: "varchar", name: "membership_tier", length: 16, default: "standard" })
  membershipTier!: MembershipTier;

  @Index()
  @Column({ type: "uuid", name: "organization_id", nullable: true })
  organizationId!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
