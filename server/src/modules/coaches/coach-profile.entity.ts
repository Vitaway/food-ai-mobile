import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity({ name: "coach_profiles" })
export class CoachProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "uuid", name: "user_id" })
  userId!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  title!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  organization!: string | null;

  @Column({ type: "text", nullable: true })
  bio!: string | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", length: 64, nullable: true })
  timezone!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
