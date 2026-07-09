import { coachProfilesRepository } from "./coach-profiles.repository";
import { coachAssignmentsRepository } from "./coach-assignments.repository";
import { mealCoachReviewsRepository } from "../meals/meal-coach-reviews.repository";
import { usersRepository } from "../users/users.repository";

export type OrganizationRosterMember = {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: "coach" | "admin";
  title: string | null;
  approvedToday: number;
  totalReviews: number;
  avgReviewMinutes: number;
  caseload: number;
  isSelf: boolean;
};

export async function buildOrganizationRoster(
  organization: string,
  viewerUserId: string,
): Promise<OrganizationRosterMember[]> {
  const coachProfiles = await coachProfilesRepository.findByOrganization(organization);
  const admins = await usersRepository.findByRole("admin");
  const allReviews = await mealCoachReviewsRepository.findAll();
  const today = new Date().toISOString().slice(0, 10);
  const seen = new Set<string>();
  const members: OrganizationRosterMember[] = [];

  for (const coachProfile of coachProfiles) {
    if (seen.has(coachProfile.userId)) continue;
    seen.add(coachProfile.userId);

    const user = await usersRepository.findById(coachProfile.userId);
    if (!user?.isActive) continue;

    const coachReviews = allReviews.filter((r) => r.coachId === coachProfile.userId);
    const approvedToday = coachReviews.filter(
      (r) => r.action === "approve" && r.reviewedAt.toISOString().slice(0, 10) === today,
    ).length;
    const durations = coachReviews
      .map((r) => r.reviewDurationSeconds)
      .filter((v): v is number => typeof v === "number" && v > 0);
    const avgReviewMinutes =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60)
        : 0;
    const caseload = await coachAssignmentsRepository.countByCoach(coachProfile.userId);

    members.push({
      userId: coachProfile.userId,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: "coach",
      title: coachProfile.title,
      approvedToday,
      totalReviews: coachReviews.length,
      avgReviewMinutes,
      caseload,
      isSelf: coachProfile.userId === viewerUserId,
    });
  }

  for (const admin of admins) {
    if (seen.has(admin.id) || !admin.isActive) continue;
    seen.add(admin.id);

    members.push({
      userId: admin.id,
      displayName: admin.displayName,
      email: admin.email,
      avatarUrl: admin.avatarUrl,
      role: "admin",
      title: "Platform admin",
      approvedToday: 0,
      totalReviews: 0,
      avgReviewMinutes: 0,
      caseload: 0,
      isSelf: admin.id === viewerUserId,
    });
  }

  return members.sort((a, b) => a.displayName.localeCompare(b.displayName));
}
