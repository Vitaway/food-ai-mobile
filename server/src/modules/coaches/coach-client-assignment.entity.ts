import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("coach_client_assignments")
export class CoachClientAssignment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "coach_user_id", type: "uuid" })
  coachUserId!: string;

  @Column({ name: "client_id", type: "varchar", length: 64 })
  clientId!: string;

  @Column({ name: "assigned_by", type: "uuid", nullable: true })
  assignedBy!: string | null;

  @CreateDateColumn({ name: "assigned_at", type: "timestamptz" })
  assignedAt!: Date;
}
