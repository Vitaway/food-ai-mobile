import type { CoachProfile, UpdateCoachPasswordPayload, UpdateCoachProfilePayload } from '@/types';

let coachProfileDb: CoachProfile = {
  id: 'coach_1',
  displayName: 'Coach Vitaway',
  email: 'coach@vitaway.com',
  phone: '+250 788 000 000',
  jobTitle: 'Senior Nutrition Coach',
  bio: 'Helping clients build sustainable eating habits with evidence-based meal reviews.',
  timezone: 'Africa/Kigali',
  memberSince: '2025-11-01T00:00:00.000Z',
};

const MOCK_PASSWORD = 'coach1234';

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchCoachProfile(): Promise<CoachProfile> {
  await delay(250);
  return { ...coachProfileDb };
}

export async function updateCoachProfile(payload: UpdateCoachProfilePayload): Promise<CoachProfile> {
  await delay(500);
  coachProfileDb = {
    ...coachProfileDb,
    ...payload,
  };
  return { ...coachProfileDb };
}

export async function updateCoachPassword(payload: UpdateCoachPasswordPayload): Promise<void> {
  await delay(600);
  if (payload.currentPassword !== MOCK_PASSWORD) {
    throw new Error('Current password is incorrect');
  }
  if (payload.newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters');
  }
}
