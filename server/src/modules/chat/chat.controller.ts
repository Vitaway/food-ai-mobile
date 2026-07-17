import {
  Authorized,
  BadRequestError,
  Body,
  Controller,
  Get,
  Param,
  Post,
  CurrentUser,
  Req,
  UseBefore,
} from "routing-controllers";
import type { Request } from "express";
import multer from "multer";
import type { User } from "../users/user.entity";
import { chatService } from "./chat.service";
import { EnsureDirectConversationDto, EnsurePatientConversationDto, SendChatMessageDto } from "./chat.dto";

const chatAttachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const STAFF_OR_CONSUMER = ["coach", "admin", "consumer"] as const;
const STAFF = ["coach", "admin"] as const;

@Controller("/chat")
export class ChatController {
  @Authorized([...STAFF_OR_CONSUMER])
  @Get("/conversations")
  listConversations(@CurrentUser() user: User) {
    return chatService.listConversations(user);
  }

  @Authorized([...STAFF])
  @Get("/contacts")
  listContacts(@CurrentUser() user: User) {
    return chatService.listContacts(user);
  }

  @Authorized([...STAFF_OR_CONSUMER])
  @Get("/unread-count")
  unreadCount(@CurrentUser() user: User) {
    return chatService.getUnreadCount(user.id).then((count) => ({ count }));
  }

  @Authorized([...STAFF_OR_CONSUMER])
  @Post("/conversations/patient")
  ensurePatientConversation(
    @CurrentUser() user: User,
    @Body() dto: EnsurePatientConversationDto,
  ) {
    return chatService.ensurePatientConversation(user, dto);
  }

  @Authorized([...STAFF])
  @Post("/conversations/direct")
  ensureDirectConversation(
    @CurrentUser() user: User,
    @Body() dto: EnsureDirectConversationDto,
  ) {
    return chatService.ensureDirectConversation(user, dto);
  }

  @Authorized([...STAFF])
  @Post("/conversations/team")
  ensureTeamChannel(@CurrentUser() user: User) {
    return chatService.ensureTeamChannel(user).then((conv) =>
      chatService.getConversation(user, conv.id),
    );
  }

  @Authorized([...STAFF])
  @Get("/conversations/:id/members")
  listMembers(@CurrentUser() user: User, @Param("id") id: string) {
    return chatService.listMembers(user, id);
  }

  @Authorized([...STAFF_OR_CONSUMER])
  @Get("/conversations/:id/messages")
  getMessages(@CurrentUser() user: User, @Param("id") id: string) {
    return chatService.getMessages(user, id);
  }

  @Authorized([...STAFF_OR_CONSUMER])
  @Post("/conversations/:id/messages/with-attachment")
  @UseBefore(chatAttachmentUpload.single("file"))
  async sendMessageWithAttachment(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    const file = req.file;
    if (!file) {
      throw new BadRequestError("Missing file (field name: file)");
    }

    const body = typeof req.body?.body === "string" ? req.body.body : "";
    const mealId = typeof req.body?.mealId === "string" ? req.body.mealId : undefined;

    return chatService.sendMessageWithAttachment(
      user,
      id,
      file.buffer,
      file.mimetype,
      file.originalname,
      body,
      mealId,
      req,
    );
  }

  @Authorized([...STAFF_OR_CONSUMER])
  @Post("/conversations/:id/messages")
  sendMessage(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: SendChatMessageDto,
  ) {
    return chatService.sendMessage(user, id, dto.body, dto.mealId);
  }

  @Authorized([...STAFF_OR_CONSUMER])
  @Post("/conversations/:id/read")
  markRead(@CurrentUser() user: User, @Param("id") id: string) {
    return chatService.markRead(user, id);
  }

  @Authorized([...STAFF_OR_CONSUMER])
  @Get("/conversations/:id")
  getConversation(@CurrentUser() user: User, @Param("id") id: string) {
    return chatService.getConversation(user, id);
  }
}
