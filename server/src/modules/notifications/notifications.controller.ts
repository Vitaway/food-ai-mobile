import {
  Authorized,
  Controller,
  CurrentUser,
  Get,
  Param,
  Patch,
  Post,
} from "routing-controllers";
import type { User } from "../users/user.entity";
import { notificationsService } from "./notifications.service";

@Controller("/consumer/notifications")
export class NotificationsController {
  @Authorized(["consumer"])
  @Get("/")
  list(@CurrentUser() user: User) {
    return notificationsService.listForUser(user.id);
  }

  @Authorized(["consumer"])
  @Get("/unread-count")
  unreadCount(@CurrentUser() user: User) {
    return notificationsService.getUnreadCount(user.id);
  }

  @Authorized(["consumer"])
  @Patch("/:id/read")
  markRead(@CurrentUser() user: User, @Param("id") id: string) {
    return notificationsService.markRead(user.id, id);
  }

  @Authorized(["consumer"])
  @Post("/read-all")
  markAllRead(@CurrentUser() user: User) {
    return notificationsService.markAllRead(user.id);
  }
}
