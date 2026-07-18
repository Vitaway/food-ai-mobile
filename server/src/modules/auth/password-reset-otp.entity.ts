import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity({ name: "password_reset_otps" })
export class PasswordResetOtp {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid", name: "user_id" })
  userId!: string;

  @Index()
  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", name: "code_hash", length: 255 })
  codeHash!: string;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @Column({ type: "timestamptz", name: "expires_at" })
  expiresAt!: Date;

  @Column({ type: "timestamptz", name: "consumed_at", nullable: true })
  consumedAt!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
