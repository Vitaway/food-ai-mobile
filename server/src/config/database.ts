import { DataSource } from "typeorm";
import { env } from "./env";
import { User } from "../modules/users/user.entity";
import { UserSession } from "../modules/auth/user-session.entity";
import { CoachProfile } from "../modules/coaches/coach-profile.entity";
import { ConsumerProfile } from "../modules/meals/consumer-profile.entity";
import { MealSubmission } from "../modules/meals/meal-submission.entity";
import { AdminAuditLog } from "../modules/admin/admin-audit.entity";
import { UserNotification } from "../modules/notifications/notification.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.DATABASE_URL,
  entities: [
    User,
    UserSession,
    CoachProfile,
    ConsumerProfile,
    MealSubmission,
    AdminAuditLog,
    UserNotification,
  ],
  migrations: ["src/migrations/*.ts"],
  migrationsTableName: "typeorm_migrations",
  synchronize: false,
  logging: env.NODE_ENV !== "production",
});
