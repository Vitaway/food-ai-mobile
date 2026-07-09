import { AuthController } from "./auth/auth.controller";
import { CoachController } from "./coaches/coach.controller";
import { ConsumerController } from "./consumers/consumer.controller";
import { HealthController } from "./health/health.controller";
import { VisionController } from "./vision/vision.controller";
import { AdminController } from "./admin/admin.controller";
import { NotificationsController } from "./notifications/notifications.controller";
import { ChatController } from "./chat/chat.controller";
import { NutritionDbController } from "./nutrition-db/nutrition-db.controller";
import { PaymentsController } from "./payments/payments.controller";
import { ReportsController } from "./reports/reports.controller";
import { UsersController } from "./users/users.controller";

export const controllers = {
  AuthController,
  CoachController,
  ConsumerController,
  ChatController,
  UsersController,
  NutritionDbController,
  PaymentsController,
  ReportsController,
  NotificationsController,
  HealthController,
  VisionController,
  AdminController,
};
