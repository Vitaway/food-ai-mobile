import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ChatThread } from '@/components/chat/ChatThread';
import { useChatMessages, useEnsurePatientConversation } from '@/hooks/useChatQueries';
import { useChatRealtime } from '@/hooks/useChatRealtime';

export function CoachMessagesPanel({
  clientId,
  mealId,
}: {
  clientId: string;
  mealId?: string;
}) {
  const ensureMutation = useEnsurePatientConversation();
  const conversationId = ensureMutation.data?.id ?? null;

  useChatRealtime();
  const { data: messages, isLoading } = useChatMessages(conversationId);

  useEffect(() => {
    void ensureMutation.mutateAsync({ clientId });
  }, [clientId]);

  if (ensureMutation.isPending && !conversationId) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-ash-grey-500">Opening conversation…</p>
        </CardBody>
      </Card>
    );
  }

  if (ensureMutation.isError) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-red-600">Could not open chat. Try again from Messages.</p>
          <Link to="/coach/messages" className="mt-2 inline-block text-sm text-blue-spruce-600 hover:underline">
            Go to Messages
          </Link>
        </CardBody>
      </Card>
    );
  }

  if (!conversationId) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <h3 className="font-bold text-ash-grey-900">Messages</h3>
        <Link
          to={`/coach/messages/${conversationId}`}
          className="shrink-0 text-sm font-semibold text-blue-spruce-600 hover:underline">
          Open full chat
        </Link>
      </CardHeader>
      <CardBody>
        <ChatThread
          conversationId={conversationId}
          messages={messages}
          isLoading={isLoading}
          mealId={mealId}
        />
      </CardBody>
    </Card>
  );
}
