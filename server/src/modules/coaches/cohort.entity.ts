import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("cohorts")
export class Cohort {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 128 })
  name!: string;

  @Column({ type: "varchar", length: 128, nullable: true })
  organization!: string | null;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}

@Entity("cohort_members")
export class CohortMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "cohort_id", type: "uuid" })
  cohortId!: string;

  @Column({ name: "client_id", type: "varchar", length: 64 })
  clientId!: string;

  @CreateDateColumn({ name: "joined_at", type: "timestamptz" })
  joinedAt!: Date;
}
