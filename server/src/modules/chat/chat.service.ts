import { BadRequestError, ForbiddenError, NotFoundError } from "routing-controllers";
import type { User } from "../users/user.entity";
import { chatRepository } from "./chat.repository";
import { coachProfilesRepository } from "../coaches/coach-profiles.repository";
import { buildOrganizationRoster } from "../coaches/team-roster.util";
import { coachAssignmentsRepository } from "../coaches/coach-assignments.repository";
import { consumerProfilesRepository } from "../consumers/consumer-profiles.repository";
import { usersRepository } from "../users/users.repository";
import { usersService } from "../users/users.service";
import { ensureCoachCanAccessClient } from "../meals/coach-scope.util";
import { notificationsService } from "../notifications/notifications.service";
import {
  broadcastChatToUsers,
  broadcastChatUnread,
} from "../../services/chat-realtime.service";
import { saveChatAttachment } from "../../services/uploads.service";
import type { Request } from "express";
import type { ChatConversation } from "./chat-conversation.entity";

function coachSafeFirstName(displayName: unknown): string {
  if (typeof displayName !== "string" || !displayName.trim()) return "Patient";
  return displayName.trim().split(/\s+/)[0];
}

function formatCoachPatientLabel(patientId: string, displayName?: string | null): string {
  return `${patientId} · ${coachSafeFirstName(displayName)}`;
}

function formatCoachLabelForPatient(coachFirstName: string): string {
  return `Coach - ${coachFirstName}`;
}

function privacySafeSenderName(
  conv: ChatConversation,
  viewer: User,
  sender: { displayName: string; role: string },
): string {
  if (conv.type !== "patient") {
    return sender.displayName ?? "User";
  }

  if (sender.role === "coach") {
    return formatCoachLabelForPatient(coachSafeFirstName(sender.displayName));
  }

  if (viewer.role === "coach" && conv.clientId) {
    return formatCoachPatientLabel(conv.clientId, sender.displayName);
  }

  return coachSafeFirstName(sender.displayName);
}

function conversationTitle(
  conv: ChatConversation,
  viewer: User,
  clientName?: string,
  coachName?: string,
  peerName?: string,
) {
  if (conv.type === "team") {
    return conv.title ?? `${conv.organization ?? "Team"} coaches`;
  }
  if (conv.type === "direct") {
    return peerName ?? "Direct message";
  }
  if (viewer.role === "coach") {
    if (conv.clientId) {
      return formatCoachPatientLabel(conv.clientId, clientName);
    }
    return clientName ?? "Patient";
  }
  return coachName ? formatCoachLabelForPatient(coachName) : "Your coach";
}

function directPair(userId: string, peerUserId: string) {
  return userId < peerUserId
    ? { coachUserId: userId, peerUserId }
    : { coachUserId: peerUserId, peerUserId: userId };
}

async function resolveParticipantUserIds(conv: ChatConversation): Promise<string[]> {
  if (conv.type === "patient") {
    const ids: string[] = [];
    if (conv.coachUserId) ids.push(conv.coachUserId);
    if (conv.clientId) {
      const consumer = await consumerProfilesRepository.findById(conv.clientId);
      if (consumer?.userId) ids.push(consumer.userId);
    }
    return ids;
  }

  if (conv.type === "team" && conv.organization) {
    const coaches = await coachProfilesRepository.findByOrganization(conv.organization);
    return coaches.map((c) => c.userId);
  }

  if (conv.type === "direct") {
    const ids = [conv.coachUserId, conv.peerUserId].filter(Boolean) as string[];
    return ids;
  }

  return [];
}

async function assertCanAccessConversation(user: User, conv: ChatConversation) {
  if (conv.type === "patient") {
    if (user.role === "coach") {
      if (conv.coachUserId !== user.id) {
        throw new ForbiddenError("You cannot access this conversation");
      }
      if (conv.clientId) {
        await ensureCoachCanAccessClient(user.id, conv.clientId);
      }
      return;
    }

    const profile = await consumerProfilesRepository.findByUserId(user.id);
    if (!profile || profile.id !== conv.clientId) {
      throw new ForbiddenError("You cannot access this conversation");
    }
    return;
  }

  if (conv.type === "team") {
    if (user.role !== "coach") {
      throw new ForbiddenError("Team channel is for coaches only");
    }
    const profile = await coachProfilesRepository.findByUserId(user.id);
    const userOrg = profile?.organization?.trim().toLowerCase();
    const channelOrg = conv.organization?.trim().toLowerCase();
    if (!userOrg || !channelOrg || userOrg !== channelOrg) {
      throw new ForbiddenError("You cannot access this team channel");
    }
    return;
  }

  if (conv.type === "direct") {
    if (conv.coachUserId !== user.id && conv.peerUserId !== user.id) {
      throw new ForbiddenError("You cannot access this conversation");
    }
    return;
  }

  throw new NotFoundError("Conversation not found");
}

async function enrichConversation(
  conv: ChatConversation,
  user: User,
  unreadMap: Map<string, number>,
) {
  let clientName: string | undefined;
  let coachName: string | undefined;
  let peerName: string | undefined;
  let peerAvatarUrl: string | null = null;

  if (conv.type === "patient" && conv.clientId) {
    const consumer = await consumerProfilesRepository.findById(conv.clientId);
    if (consumer) {
      const profileName = consumer.profile?.displayName;
      clientName = coachSafeFirstName(profileName);
      if (consumer.userId) {
        const u = await usersRepository.findById(consumer.userId);
        if (u) {
          clientName = coachSafeFirstName(u.displayName);
          if (user.role === "coach") {
            peerAvatarUrl = u.avatarUrl ?? null;
          }
        }
      }
    }
  }

  if (conv.type === "patient" && conv.coachUserId) {
    const coach = await usersRepository.findById(conv.coachUserId);
    coachName = coachSafeFirstName(coach?.displayName);
    if (user.role === "consumer") {
      peerAvatarUrl = coach?.avatarUrl ?? null;
    }
  }

  if (conv.type === "direct") {
    const peerId = conv.coachUserId === user.id ? conv.peerUserId : conv.coachUserId;
    if (peerId) {
      const peer = await usersRepository.findById(peerId);
      peerName = peer?.displayName ?? "User";
    }
  }

  let memberCount: number | null = null;
  if (conv.type === "team" && conv.organization) {
    const roster = await buildOrganizationRoster(conv.organization, user.id);
    memberCount = roster.length;
  }

  return {
    id: conv.id,
    type: conv.type,
    title: conversationTitle(conv, user, clientName, coachName, peerName),
    coachUserId: conv.coachUserId,
    clientId: conv.clientId,
    patientId: conv.type === "patient" ? conv.clientId : null,
    peerUserId: conv.peerUserId,
    peerAvatarUrl,
    organization: conv.organization,
    memberCount,
    lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
    lastMessagePreview: conv.lastMessagePreview,
    unreadCount: unreadMap.get(conv.id) ?? 0,
    createdAt: conv.createdAt.toISOString(),
  };
}

function mapMessageForViewer(
  conv: ChatConversation,
  viewer: User,
  message: {
    id: string;
    conversationId: string;
    senderUserId: string;
    body: string;
    mealId: string | null;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    attachmentMime?: string | null;
    attachmentKind?: "image" | "file" | null;
    createdAt: Date;
  },
  sender: { displayName: string; role: string; avatarUrl?: string | null } | undefined,
) {
  const safeSender = {
    displayName: sender?.displayName ?? "User",
    role: sender?.role ?? "consumer",
  };

  return {
    id: message.id,
    conversationId: message.conversationId,
    senderUserId: message.senderUserId,
    senderName: privacySafeSenderName(conv, viewer, safeSender),
    senderRole: safeSender.role,
    senderAvatarUrl: sender?.avatarUrl ?? null,
    body: message.body,
    mealId: message.mealId,
    attachmentUrl: message.attachmentUrl ?? null,
    attachmentName: message.attachmentName ?? null,
    attachmentMime: message.attachmentMime ?? null,
    attachmentKind: message.attachmentKind ?? null,
    createdAt: message.createdAt.toISOString(),
    isMine: message.senderUserId === viewer.id,
  };
}

function messagePreview(
  body: string,
  attachmentKind?: "image" | "file" | null,
  attachmentName?: string | null,
): string {
  const trimmed = body.trim();
  if (trimmed) return trimmed;
  if (attachmentKind === "image") return "📷 Photo";
  if (attachmentName) return `📎 ${attachmentName}`;
  return "📎 Attachment";
}

async function deliverChatMessage(
  user: User,
  conv: ChatConversation,
  data: {
    body: string;
    mealId?: string | null;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    attachmentMime?: string | null;
    attachmentKind?: "image" | "file" | null;
  },
) {
  const trimmed = data.body.trim();
  const hasAttachment = Boolean(data.attachmentUrl);
  if (!trimmed && !hasAttachment) {
    throw new BadRequestError("Message cannot be empty");
  }

  const message = await chatRepository.saveMessage({
    conversationId: conv.id,
    senderUserId: user.id,
    body: trimmed,
    mealId: data.mealId ?? null,
    attachmentUrl: data.attachmentUrl ?? null,
    attachmentName: data.attachmentName ?? null,
    attachmentMime: data.attachmentMime ?? null,
    attachmentKind: data.attachmentKind ?? null,
  });

  const preview = messagePreview(trimmed, data.attachmentKind, data.attachmentName);
  await chatRepository.updateConversationPreview(conv.id, preview, message.createdAt);
  await chatRepository.markRead(conv.id, user.id);

  const senderDto = mapMessageForViewer(conv, user, message, user);

  const participants = await resolveParticipantUserIds(conv);
  for (const participantId of participants) {
    const participant = await usersRepository.findById(participantId);
    if (!participant) continue;

    const participantDto = mapMessageForViewer(conv, participant, message, user);
    broadcastChatToUsers([participantId], {
      type: "message",
      conversationId: conv.id,
      message: participantDto,
    });
  }

  for (const participantId of participants) {
    if (participantId === user.id) continue;
    const unreadCount = await chatRepository.countUnreadForUser(participantId);
    broadcastChatUnread(participantId, unreadCount);

    if (conv.type === "patient") {
      const title =
        user.role === "coach" ? "Message from your coach" : "Message from your patient";
      void notificationsService.create({
        userId: participantId,
        kind: "system",
        title,
        message: preview.slice(0, 120),
        mealId: data.mealId ?? null,
        data: { conversationId: conv.id },
      });
    } else if (conv.type === "direct") {
      void notificationsService.create({
        userId: participantId,
        kind: "system",
        title: "New message",
        message: preview.slice(0, 120),
        mealId: null,
        data: { conversationId: conv.id },
      });
    } else if (conv.type === "team") {
      void notificationsService.create({
        userId: participantId,
        kind: "system",
        title: "Team message",
        message: preview.slice(0, 120),
        mealId: null,
        data: { conversationId: conv.id },
      });
    }
  }

  return senderDto;
}

export const chatService = {
  async listConversations(user: User) {
    let conversations: ChatConversation[] = [];

    if (user.role === "coach") {
      const profile = await coachProfilesRepository.findByUserId(user.id);
      conversations = await chatRepository.listCoachConversations(
        user.id,
        profile?.organization ?? null,
      );
      if (profile?.organization) {
        const team = await this.ensureTeamChannel(user);
        if (!conversations.some((c) => c.id === team.id)) {
          conversations = [team, ...conversations];
        }
      }
    } else {
      const profile = await consumerProfilesRepository.findByUserId(user.id);
      conversations = await chatRepository.listUserConversations(user.id, profile?.id ?? null);
    }

    const unreadRows = await chatRepository.unreadByConversation(
      user.id,
      conversations.map((c) => c.id),
    );
    const unreadMap = new Map(unreadRows.map((r) => [r.conversationId, Number(r.count)]));

    return Promise.all(conversations.map((c) => enrichConversation(c, user, unreadMap)));
  },

  async getUnreadCount(userId: string) {
    return chatRepository.countUnreadForUser(userId);
  },

  async listContacts(user: User) {
    if (user.role !== "coach") {
      throw new ForbiddenError("Only coaches can browse chat contacts");
    }

    const users = await usersService.listForMessaging(user);
    const conversations = await chatRepository.listCoachConversations(user.id, null);
    const patientConvByClient = new Map(
      conversations
        .filter((c) => c.type === "patient" && c.clientId)
        .map((c) => [c.clientId!, c.id]),
    );
    const directConvByPeer = new Map<string, string>();
    for (const conv of conversations) {
      if (conv.type !== "direct") continue;
      const peerId = conv.coachUserId === user.id ? conv.peerUserId : conv.coachUserId;
      if (peerId) directConvByPeer.set(peerId, conv.id);
    }

    return users
      .map((contact) => {
        const conversationId =
          contact.clientId && contact.role === "consumer"
            ? (patientConvByClient.get(contact.clientId) ?? null)
            : (directConvByPeer.get(contact.userId) ?? null);
        return { ...contact, conversationId };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  },

  async ensureDirectConversation(user: User, opts: { userId: string }) {
    if (user.role !== "coach") {
      throw new ForbiddenError("Only coaches can start direct conversations");
    }

    const peerUserId = opts.userId?.trim();
    if (!peerUserId) throw new BadRequestError("userId is required");
    if (peerUserId === user.id) throw new BadRequestError("You cannot message yourself");

    const peer = await usersRepository.findById(peerUserId);
    if (!peer || !peer.isActive) throw new NotFoundError("User not found");

    if (peer.role === "consumer") {
      const profile = await consumerProfilesRepository.findByUserId(peerUserId);
      if (profile) {
        return this.ensurePatientConversation(user, { clientId: profile.id });
      }
    }

    const pair = directPair(user.id, peerUserId);
    let conv = await chatRepository.findDirectConversation(user.id, peerUserId);
    if (!conv) {
      conv = await chatRepository.createConversation({
        type: "direct",
        coachUserId: pair.coachUserId,
        peerUserId: pair.peerUserId,
        title: null,
      });
    }
    return this.getConversation(user, conv.id);
  },

  async ensurePatientConversation(
    user: User,
    opts: { clientId?: string; coachUserId?: string },
  ) {
    if (user.role === "coach") {
      const clientId = opts.clientId?.trim();
      if (!clientId) throw new BadRequestError("clientId is required");

      const consumer = await consumerProfilesRepository.findById(clientId);
      if (!consumer) throw new NotFoundError("Patient not found");

      await coachAssignmentsRepository.assign(user.id, clientId, user.id);

      let conv = await chatRepository.findPatientConversation(user.id, clientId);
      if (!conv) {
        conv = await chatRepository.createConversation({
          type: "patient",
          coachUserId: user.id,
          clientId,
          title: null,
        });
      }
      return this.getConversation(user, conv.id);
    }

    const profile = await consumerProfilesRepository.findByUserId(user.id);
    if (!profile) throw new ForbiddenError("Patient profile not found");

    let coachUserId = opts.coachUserId;
    if (!coachUserId) {
      const assignments = await coachAssignmentsRepository.findByClientId(profile.id);
      coachUserId = assignments[0]?.coachUserId;
    }
    if (!coachUserId) {
      throw new BadRequestError("No coach assigned yet. Your care team will reach out soon.");
    }

    let conv = await chatRepository.findPatientConversation(coachUserId, profile.id);
    if (!conv) {
      conv = await chatRepository.createConversation({
        type: "patient",
        coachUserId,
        clientId: profile.id,
        title: null,
      });
    }
    return this.getConversation(user, conv.id);
  },

  async ensureTeamChannel(user: User) {
    if (user.role !== "coach") {
      throw new ForbiddenError("Team channel is for coaches only");
    }
    const profile = await coachProfilesRepository.findByUserId(user.id);
    const organization = profile?.organization?.trim();
    if (!organization) {
      throw new BadRequestError("Set your organization on your profile to join the team channel");
    }

    let conv = await chatRepository.findTeamByOrganization(organization);
    if (!conv) {
      conv = await chatRepository.createConversation({
        type: "team",
        organization,
        title: `${organization} · Coach lounge`,
      });
    }
    return conv;
  },

  async getConversation(user: User, conversationId: string) {
    const conv = await chatRepository.findConversationById(conversationId);
    if (!conv) throw new NotFoundError("Conversation not found");
    await assertCanAccessConversation(user, conv);

    const unreadRows = await chatRepository.unreadByConversation(user.id, [conv.id]);
    const unreadMap = new Map(unreadRows.map((r) => [r.conversationId, Number(r.count)]));

    return enrichConversation(conv, user, unreadMap);
  },

  async listMembers(user: User, conversationId: string) {
    const conv = await chatRepository.findConversationById(conversationId);
    if (!conv) throw new NotFoundError("Conversation not found");
    await assertCanAccessConversation(user, conv);

    if (conv.type !== "team" || !conv.organization) {
      throw new BadRequestError("Members are only available for team channels");
    }

    const roster = await buildOrganizationRoster(conv.organization, user.id);

    return {
      conversationId: conv.id,
      organization: conv.organization,
      title: conv.title ?? `${conv.organization} · Coach lounge`,
      memberCount: roster.length,
      members: roster.map((member) => ({
        userId: member.userId,
        displayName: member.displayName,
        email: member.email,
        avatarUrl: member.avatarUrl,
        role: member.role,
        title: member.title,
        isSelf: member.isSelf,
      })),
    };
  },

  async getMessages(user: User, conversationId: string) {
    const conv = await chatRepository.findConversationById(conversationId);
    if (!conv) throw new NotFoundError("Conversation not found");
    await assertCanAccessConversation(user, conv);

    const messages = await chatRepository.findMessages(conversationId);
    const senderIds = [...new Set(messages.map((m) => m.senderUserId))];
    const senders = await Promise.all(senderIds.map((id) => usersRepository.findById(id)));
    const senderMap = new Map(
      senders.filter(Boolean).map((s) => [s!.id, s!]),
    );

    await chatRepository.markRead(conversationId, user.id);
    const unreadCount = await chatRepository.countUnreadForUser(user.id);
    broadcastChatUnread(user.id, unreadCount);

    return messages.map((m) => {
      const sender = senderMap.get(m.senderUserId);
      return mapMessageForViewer(conv, user, m, sender);
    });
  },

  async sendMessage(
    user: User,
    conversationId: string,
    body: string,
    mealId?: string,
  ) {
    const conv = await chatRepository.findConversationById(conversationId);
    if (!conv) throw new NotFoundError("Conversation not found");
    await assertCanAccessConversation(user, conv);

    return deliverChatMessage(user, conv, { body, mealId: mealId ?? null });
  },

  async sendMessageWithAttachment(
    user: User,
    conversationId: string,
    fileBuffer: Buffer,
    mimeType: string,
    originalName: string | undefined,
    body: string | undefined,
    mealId: string | undefined,
    req?: Request,
  ) {
    const conv = await chatRepository.findConversationById(conversationId);
    if (!conv) throw new NotFoundError("Conversation not found");
    await assertCanAccessConversation(user, conv);

    const attachment = saveChatAttachment(
      fileBuffer,
      mimeType,
      conversationId,
      originalName,
      req,
    );

    return deliverChatMessage(user, conv, {
      body: body?.trim() ?? "",
      mealId: mealId ?? null,
      ...attachment,
    });
  },

  async markRead(user: User, conversationId: string) {
    const conv = await chatRepository.findConversationById(conversationId);
    if (!conv) throw new NotFoundError("Conversation not found");
    await assertCanAccessConversation(user, conv);
    await chatRepository.markRead(conversationId, user.id);
    const unreadCount = await chatRepository.countUnreadForUser(user.id);
    broadcastChatUnread(user.id, unreadCount);
    return { ok: true, unreadCount };
  },
};
