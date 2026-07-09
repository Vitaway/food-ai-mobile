import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "consumer_daily_health_scores" })
@Unique("uq_consumer_daily_health_scores_client_date", ["clientId", "date"])
export class ConsumerDailyHealthScore {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", name: "client_id", length: 64 })
  clientId!: string;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "numeric", precision: 6, scale: 2, default: 0, name: "nutrient_score" })
  nutrientScore!: string;

  @Column({ type: "numeric", precision: 6, scale: 2, default: 0, name: "macro_score" })
  macroScore!: string;

  @Column({ type: "numeric", precision: 6, scale: 2, default: 0, name: "calorie_score" })
  calorieScore!: string;

  @Column({ type: "numeric", precision: 6, scale: 2, default: 0, name: "consistency_score" })
  consistencyScore!: string;

  @Column({ type: "numeric", precision: 6, scale: 2, default: 0, name: "variety_score" })
  varietyScore!: string;

  @Column({ type: "numeric", precision: 6, scale: 2, default: 0, name: "total_score" })
  totalScore!: string;

  @Column({ type: "jsonb", default: {} })
  context!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
