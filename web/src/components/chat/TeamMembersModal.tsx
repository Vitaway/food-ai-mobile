import { useMemo, useState } from 'react';
import type { ChatConversation, ChatTeamMember } from '@/api/chatApi';
import { Modal } from '@/components/ui/Modal';
import { UserAvatar } from '@/components/ui/AvatarUpload';
import { useChatMembers } from '@/hooks/useChatQueries';
import { useCoachTeam } from '@/hooks/useCoachQueries';

type TeamMembersModalProps = {
  open: boolean;
  onClose: () => void;
  conversation: ChatConversation | null | undefined;
};

function MemberAvatar({ name, imageUrl, role }: { name: string; imageUrl?: string | null; role?: string }) {
  return (
    <UserAvatar
      name={name}
      imageUrl={imageUrl}
      size="md"
      className={role === 'admin' ? 'ring-2 ring-cinnamon-wood-200' : undefined}
    />
  );
}

function teamCoachesToMembers(
  coaches: Array<{
    coachUserId: string;
    displayName: string;
    avatarUrl?: string | null;
    role?: string;
    isSelf: boolean;
    title?: string | null;
  }>,
): ChatTeamMember[] {
  return coaches.map((coach) => ({
    userId: coach.coachUserId,
    displayName: coach.displayName,
    email: null,
    avatarUrl: coach.avatarUrl,
    role: coach.role,
    title: coach.title ?? (coach.role === 'admin' ? 'Platform admin' : 'Coach'),
    isSelf: coach.isSelf,
  }));
}

export function TeamMembersModal({ open, onClose, conversation }: TeamMembersModalProps) {
  const [search, setSearch] = useState('');
  const isTeam = conversation?.type === 'team';

  const membersQuery = useChatMembers(conversation?.id ?? null, open && isTeam);
  const teamQuery = useCoachTeam(open && isTeam);

  const members = useMemo(() => {
    if (membersQuery.data?.members?.length) return membersQuery.data.members;
    if (teamQuery.data?.coaches?.length) return teamCoachesToMembers(teamQuery.data.coaches);
    return [];
  }, [membersQuery.data?.members, teamQuery.data?.coaches]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        (m.email?.toLowerCase().includes(q) ?? false) ||
        (m.title?.toLowerCase().includes(q) ?? false),
    );
  }, [members, search]);

  const isLoading = membersQuery.isLoading || (membersQuery.isError && teamQuery.isLoading);
  const isError = membersQuery.isError && teamQuery.isError && !members.length;

  function handleClose() {
    onClose();
    setSearch('');
  }

  const title = membersQuery.data?.title ?? conversation?.title ?? 'Team channel';
  const organization =
    membersQuery.data?.organization ?? teamQuery.data?.organization ?? conversation?.organization;
  const memberCount =
    membersQuery.data?.memberCount ?? teamQuery.data?.coaches?.length ?? conversation?.memberCount ?? members.length;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Group info"
      description={organization ? `${organization} · ${memberCount} members` : `${memberCount} members`}
      size="md">
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-spruce-100 text-3xl">
          👥
        </div>
        <h3 className="mt-3 text-lg font-semibold text-ash-grey-900">{title}</h3>
        {organization ? <p className="mt-0.5 text-sm text-ash-grey-500">{organization}</p> : null}
        <p className="mt-1 text-xs text-ash-grey-400">
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </p>
      </div>

      <div className="relative mb-4">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash-grey-400"
          aria-hidden>
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members"
          className="w-full rounded-xl border border-ash-grey-200 py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-ash-grey-400 focus:border-blue-spruce-400 focus:ring-2 focus:ring-blue-spruce-100"
        />
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ash-grey-500">
        {memberCount} {memberCount === 1 ? 'participant' : 'participants'}
      </p>

      <div className="-mx-2 max-h-[min(360px,45vh)] overflow-y-auto">
        {isLoading ? (
          <p className="px-2 py-8 text-center text-sm text-ash-grey-500">Loading members…</p>
        ) : isError ? (
          <p className="px-2 py-8 text-center text-sm text-cinnamon-wood-600">
            Could not load members. Check your organization is set on your profile.
          </p>
        ) : filtered.length ? (
          <ul className="divide-y divide-ash-grey-100">
            {filtered.map((member) => (
              <li key={member.userId}>
                <div className="flex items-center gap-3 rounded-xl px-2 py-3">
                  <MemberAvatar name={member.displayName} imageUrl={member.avatarUrl} role={member.role} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ash-grey-900">
                      {member.displayName}
                      {member.isSelf ? (
                        <span className="ml-1.5 text-xs font-normal text-blue-spruce-600">(you)</span>
                      ) : null}
                      {member.role === 'admin' ? (
                        <span className="ml-1.5 text-xs font-normal text-cinnamon-wood-600">Admin</span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-ash-grey-500">
                      {member.title ?? 'Coach'}
                      {member.email ? ` · ${member.email}` : ''}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2 py-8 text-center text-sm text-ash-grey-500">
            {search ? 'No members match your search.' : 'No coaches in this organization yet.'}
          </p>
        )}
      </div>
    </Modal>
  );
}
