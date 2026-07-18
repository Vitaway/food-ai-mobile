import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "consumer_water_logs" })
@Index(["clientId", "date"])
export class ConsumerWaterLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "client_id", type: "varchar", length: 64 })
  clientId!: string;

  @Column({ type: "date" })
  date!: string;

  @Column({ name: "amount_ml", type: "int" })
  amountMl!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
