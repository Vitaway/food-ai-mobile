import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "organization_module_entitlements" })
@Index(["organizationKey", "moduleKey"], { unique: true })
export class OrganizationModuleEntitlement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** Matches coach_profiles.organization / partner account name (case-insensitive lookup). */
  @Column({ name: "organization_key", type: "varchar", length: 255 })
  organizationKey!: string;

  @Column({ name: "module_key", type: "varchar", length: 64 })
  moduleKey!: string;

  @Column({ type: "boolean", default: true })
  enabled!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
