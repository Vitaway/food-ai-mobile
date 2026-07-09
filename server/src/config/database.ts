import { DataSource } from "typeorm";
import { env } from "./env";
import { User } from "../modules/users/user.entity";
import { UserSession } from "../modules/auth/user-session.entity";
import { CoachProfile } from "../modules/coaches/coach-profile.entity";
import { ConsumerProfile } from "../modules/meals/consumer-profile.entity";
import { MealSubmission } from "../modules/meals/meal-submission.entity";
import { AdminAuditLog } from "../modules/admin/admin-audit.entity";
import { UserNotification } from "../modules/notifications/notification.entity";
import { UserPushToken } from "../modules/notifications/user-push-token.entity";
import { MealCoachReview } from "../modules/meals/meal-coach-review.entity";
import { MealReviewTask } from "../modules/meals/meal-review-task.entity";
import { CoachReviewDraft } from "../modules/meals/coach-review-draft.entity";
import { CoachClientAssignment } from "../modules/coaches/coach-client-assignment.entity";
import { Cohort, CohortMember } from "../modules/coaches/cohort.entity";
import { CoachMessage } from "../modules/coaches/coach-message.entity";
import { ChatConversation } from "../modules/chat/chat-conversation.entity";
import { ChatMessage } from "../modules/chat/chat-message.entity";
import { ChatReadState } from "../modules/chat/chat-read-state.entity";
import { NutritionFood } from "../modules/nutrition-db/nutrition-food.entity";
import { NutritionServingProfile } from "../modules/nutrition-db/nutrition-serving-profile.entity";
import { ConsumerDailyHealthScore } from "../modules/consumers/daily-health-score.entity";
import { Subscription } from "../modules/payments/subscription.entity";
import { PaymentTransaction } from "../modules/payments/payment-transaction.entity";
import { ReportSnapshot } from "../modules/reports/report-snapshot.entity";
import { FamilySubscriptionMember } from "../modules/payments/family-subscription-member.entity";
import { Organization } from "../modules/payments/organization.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.DATABASE_URL,
  entities: [
    User,
    UserSession,
    CoachProfile,
    ConsumerProfile,
    MealSubmission,
    MealCoachReview,
    MealReviewTask,
    CoachReviewDraft,
    CoachClientAssignment,
    Cohort,
    CohortMember,
    CoachMessage,
    ChatConversation,
    ChatMessage,
    ChatReadState,
    NutritionFood,
    NutritionServingProfile,
    ConsumerDailyHealthScore,
    Subscription,
    PaymentTransaction,
    FamilySubscriptionMember,
    Organization,
    ReportSnapshot,
    AdminAuditLog,
    UserNotification,
    UserPushToken,
  ],
  migrations: [
    env.NODE_ENV === "production" ? "dist/migrations/*.js" : "src/migrations/*.ts",
  ],
  migrationsTableName: "typeorm_migrations",
  synchronize: false,
  logging: env.TYPEORM_QUERY_LOG,
});
