import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type OrganizationStatus = "active" | "inactive";

@Entity({ name: "organizations" })
export class Organization {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "varchar", length: 32, default: "active" })
  status!: OrganizationStatus;

  @Column({ type: "varchar", name: "contact_email", length: 255, nullable: true })
  contactEmail!: string | null;

  @Column({ type: "varchar", name: "contact_phone", length: 32, nullable: true })
  contactPhone!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
