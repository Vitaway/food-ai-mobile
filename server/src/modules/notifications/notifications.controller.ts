import {
  Authorized,
  Body,
  Controller,
  CurrentUser,
  Get,
  Param,
  Patch,
  Post,
} from "routing-controllers";
import type { User } from "../users/user.entity";
import { RegisterPushTokenDto, UnregisterPushTokenDto } from "./notifications.dto";
import { notificationsService } from "./notifications.service";

const NOTIFICATION_ROLES = ["consumer", "coach"] as const;

@Controller("/consumer/notifications")
export class NotificationsController {
  @Authorized([...NOTIFICATION_ROLES])
  @Get("/")
  list(@CurrentUser() user: User) {
    return notificationsService.listForUser(user.id);
  }

  @Authorized([...NOTIFICATION_ROLES])
  @Get("/unread-count")
  unreadCount(@CurrentUser() user: User) {
    return notificationsService.getUnreadCount(user.id);
  }

  @Authorized([...NOTIFICATION_ROLES])
  @Patch("/:id/read")
  markRead(@CurrentUser() user: User, @Param("id") id: string) {
    return notificationsService.markRead(user.id, id);
  }

  @Authorized([...NOTIFICATION_ROLES])
  @Post("/read-all")
  markAllRead(@CurrentUser() user: User) {
    return notificationsService.markAllRead(user.id);
  }

  @Authorized([...NOTIFICATION_ROLES])
  @Post("/push-token")
  registerPushToken(@CurrentUser() user: User, @Body() dto: RegisterPushTokenDto) {
    return notificationsService.registerPushToken(user.id, dto.token, dto.platform);
  }

  @Authorized([...NOTIFICATION_ROLES])
  @Post("/push-token/unregister")
  unregisterPushToken(@CurrentUser() user: User, @Body() dto: UnregisterPushTokenDto) {
    return notificationsService.unregisterPushToken(user.id, dto.token);
  }
}
