import { AuthController } from "./auth/auth.controller";
import { CoachController } from "./coaches/coach.controller";
import { ConsumerController } from "./consumers/consumer.controller";
import { HealthController } from "./health/health.controller";
import { VisionController } from "./vision/vision.controller";
import { AdminController } from "./admin/admin.controller";
import { NotificationsController } from "./notifications/notifications.controller";

export const controllers = {
  AuthController,
  CoachController,
  ConsumerController,
  NotificationsController,
  HealthController,
  VisionController,
  AdminController,
};
