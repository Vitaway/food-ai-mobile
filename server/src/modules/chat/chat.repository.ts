import { AppDataSource } from "../../config/database";
import { ChatConversation } from "./chat-conversation.entity";
import { ChatMessage } from "./chat-message.entity";
import { ChatReadState } from "./chat-read-state.entity";

export class ChatRepository {
  private conversations = AppDataSource.getRepository(ChatConversation);
  private messages = AppDataSource.getRepository(ChatMessage);
  private readStates = AppDataSource.getRepository(ChatReadState);

  findPatientConversation(coachUserId: string, clientId: string) {
    return this.conversations.findOne({
      where: { type: "patient", coachUserId, clientId },
    });
  }

  findDirectConversation(userA: string, userB: string) {
    const [coachUserId, peerUserId] = userA < userB ? [userA, userB] : [userB, userA];
    return this.conversations.findOne({
      where: { type: "direct", coachUserId, peerUserId },
    });
  }

  findTeamByOrganization(organization: string) {
    return this.conversations.findOne({
      where: { type: "team", organization },
    });
  }

  findConversationById(id: string) {
    return this.conversations.findOne({ where: { id } });
  }

  createConversation(data: Partial<ChatConversation>) {
    return this.conversations.save(this.conversations.create(data));
  }

  updateConversationPreview(id: string, preview: string, at: Date) {
    return this.conversations.update(id, {
      lastMessageAt: at,
      lastMessagePreview: preview.slice(0, 200),
    });
  }

  listCoachConversations(coachUserId: string, organization: string | null) {
    const qb = this.conversations
      .createQueryBuilder("c")
      .where("(c.type = 'patient' AND c.coach_user_id = :coachUserId)", { coachUserId })
      .orWhere(
        "(c.type = 'direct' AND (c.coach_user_id = :coachUserId OR c.peer_user_id = :coachUserId))",
        { coachUserId },
      );

    if (organization) {
      qb.orWhere("(c.type = 'team' AND c.organization = :organization)", { organization });
    }

    return qb.orderBy("c.last_message_at", "DESC", "NULLS LAST").getMany();
  }

  listUserConversations(userId: string, clientId: string | null) {
    const qb = this.conversations.createQueryBuilder("c");
    const clauses = [
      "(c.type = 'direct' AND (c.coach_user_id = :userId OR c.peer_user_id = :userId))",
    ];
    if (clientId) {
      clauses.unshift("(c.type = 'patient' AND c.client_id = :clientId)");
    }
    qb.where(clauses.join(" OR "), { userId, clientId });
    return qb.orderBy("c.last_message_at", "DESC", "NULLS LAST").getMany();
  }

  listPatientConversations(clientId: string) {
    return this.conversations.find({
      where: { type: "patient", clientId },
      order: { lastMessageAt: "DESC" },
    });
  }

  findMessages(conversationId: string, limit = 100) {
    return this.messages.find({
      where: { conversationId },
      order: { createdAt: "ASC" },
      take: limit,
    });
  }

  saveMessage(data: {
    conversationId: string;
    senderUserId: string;
    body: string;
    mealId?: string | null;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    attachmentMime?: string | null;
    attachmentKind?: "image" | "file" | null;
  }) {
    return this.messages.save(this.messages.create(data));
  }

  getReadState(conversationId: string, userId: string) {
    return this.readStates.findOne({ where: { conversationId, userId } });
  }

  async markRead(conversationId: string, userId: string, at = new Date()) {
    await this.readStates.save(
      this.readStates.create({ conversationId, userId, lastReadAt: at }),
    );
  }

  countUnreadForUser(userId: string) {
    return this.messages
      .createQueryBuilder("m")
      .innerJoin(ChatConversation, "c", "c.id = m.conversation_id")
      .leftJoin(
        ChatReadState,
        "r",
        "r.conversation_id = m.conversation_id AND r.user_id = :userId",
        { userId },
      )
      .where("m.sender_user_id != :userId", { userId })
      .andWhere("(r.last_read_at IS NULL OR m.created_at > r.last_read_at)")
      .andWhere(
        `(
          (c.type = 'patient' AND (c.coach_user_id = :userId OR EXISTS (
            SELECT 1 FROM consumer_profiles cp WHERE cp.id = c.client_id AND cp.user_id = :userId
          )))
          OR
          (c.type = 'direct' AND (c.coach_user_id = :userId OR c.peer_user_id = :userId))
          OR
          (c.type = 'team' AND EXISTS (
            SELECT 1 FROM coach_profiles cp
            INNER JOIN coach_profiles mine ON mine.user_id = :userId
            WHERE cp.organization = c.organization AND cp.organization = mine.organization
          ))
        )`,
        { userId },
      )
      .getCount();
  }

  unreadByConversation(userId: string, conversationIds: string[]) {
    if (!conversationIds.length) return Promise.resolve([] as { conversationId: string; count: number }[]);

    return this.messages
      .createQueryBuilder("m")
      .select("m.conversation_id", "conversationId")
      .addSelect("COUNT(*)::int", "count")
      .leftJoin(
        ChatReadState,
        "r",
        "r.conversation_id = m.conversation_id AND r.user_id = :userId",
        { userId },
      )
      .where("m.conversation_id IN (:...conversationIds)", { conversationIds })
      .andWhere("m.sender_user_id != :userId", { userId })
      .andWhere("(r.last_read_at IS NULL OR m.created_at > r.last_read_at)")
      .groupBy("m.conversation_id")
      .getRawMany<{ conversationId: string; count: number }>();
  }
}

export const chatRepository = new ChatRepository();
