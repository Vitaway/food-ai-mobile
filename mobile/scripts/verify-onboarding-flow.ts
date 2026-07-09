/**
 * Lightweight verification for onboarding auth routing.
 * Run: npx tsx scripts/verify-onboarding-flow.ts
 */
import { resolveAuthTarget } from '../src/utils/authRouting';
import {
  getInitialOnboardingStepIndex,
  getMinimumOnboardingStepIndex,
  ONBOARDING_STEPS,
} from '../src/utils/onboardingResume';
import { deriveOnboardingComplete } from '../src/utils/onboardingStatus';

type Case = {
  name: string;
  input: Parameters<typeof resolveAuthTarget>[0];
  expected: string | null;
};

const routingCases: Case[] = [
  {
    name: 'logged out → login',
    input: { requiresAuth: true, isAuthenticated: false, hasCompletedOnboarding: false, root: 'index' },
    expected: '/auth/login',
  },
  {
    name: 'logged in, not onboarded, on tabs → onboarding',
    input: { requiresAuth: true, isAuthenticated: true, hasCompletedOnboarding: false, root: '(tabs)' },
    expected: '/onboarding',
  },
  {
    name: 'logged in, not onboarded, on meal → onboarding',
    input: { requiresAuth: true, isAuthenticated: true, hasCompletedOnboarding: false, root: 'meal' },
    expected: '/onboarding',
  },
  {
    name: 'logged in, not onboarded, already on onboarding → stay',
    input: { requiresAuth: true, isAuthenticated: true, hasCompletedOnboarding: false, root: 'onboarding' },
    expected: null,
  },
  {
    name: 'logged in, onboarded, on login → tabs',
    input: { requiresAuth: true, isAuthenticated: true, hasCompletedOnboarding: true, root: 'auth', authScreen: 'login' },
    expected: '/(tabs)',
  },
  {
    name: 'logged in, onboarded, on onboarding → tabs',
    input: { requiresAuth: true, isAuthenticated: true, hasCompletedOnboarding: true, root: 'onboarding' },
    expected: '/(tabs)',
  },
  {
    name: 'logged in, onboarded, on tabs → stay',
    input: { requiresAuth: true, isAuthenticated: true, hasCompletedOnboarding: true, root: '(tabs)' },
    expected: null,
  },
  {
    name: 'fresh login, not onboarded, on auth → onboarding',
    input: { requiresAuth: true, isAuthenticated: true, hasCompletedOnboarding: false, root: 'auth', authScreen: 'login' },
    expected: '/onboarding',
  },
];

let failed = 0;

console.log('── Auth routing ──');
for (const test of routingCases) {
  const actual = resolveAuthTarget(test.input);
  const pass = actual === test.expected;
  if (!pass) {
    failed += 1;
    console.log(`✗ ${test.name}`);
    console.log(`  expected: ${test.expected}`);
    console.log(`  actual:   ${actual}`);
  } else {
    console.log(`✓ ${test.name}`);
  }
}

console.log('\n── Onboarding resume ──');
const guestStep = getInitialOnboardingStepIndex({ isAuthenticated: false });
const authedStep = getInitialOnboardingStepIndex({ isAuthenticated: true });
const guestMin = getMinimumOnboardingStepIndex(false);
const authedMin = getMinimumOnboardingStepIndex(true);

if (guestStep === 0) console.log('✓ guest starts at intro');
else {
  failed += 1;
  console.log(`✗ guest should start at intro (0), got ${guestStep}`);
}

if (authedStep === ONBOARDING_STEPS.indexOf('photo')) {
  console.log('✓ logged-in user skips intro (starts at photo)');
} else {
  failed += 1;
  console.log(`✗ logged-in user should start at photo, got ${authedStep}`);
}

if (authedMin === ONBOARDING_STEPS.indexOf('photo')) {
  console.log('✓ logged-in user cannot go back to intro');
} else {
  failed += 1;
  console.log(`✗ logged-in min step should be photo, got ${authedMin}`);
}

if (guestMin === 0) console.log('✓ guest can start from intro');
else {
  failed += 1;
  console.log(`✗ guest min step should be 0, got ${guestMin}`);
}

console.log('\n── Onboarding status ──');
if (!deriveOnboardingComplete({ displayName: 'New', email: 'a@b.com', onboardingComplete: false })) {
  console.log('✓ fresh account is not onboarded');
} else {
  failed += 1;
  console.log('✗ fresh account should not be onboarded');
}

if (
  deriveOnboardingComplete({
    onboardingComplete: false,
    age: 30,
    heightCm: 175,
    weightKg: 70,
    goal: 'lose_weight',
    activityLevel: 'moderately_active',
    bmr: 1600,
    macroTargets: { calories: 2000, proteinG: 120, carbsG: 200, fatG: 65, fiberG: 28 },
  })
) {
  console.log('✓ legacy profile with health data counts as onboarded');
} else {
  failed += 1;
  console.log('✗ legacy profile with health data should count as onboarded');
}

if (
  deriveOnboardingComplete({
    onboardingComplete: true,
    age: 30,
  })
) {
  console.log('✓ explicit onboardingComplete flag is honored');
} else {
  failed += 1;
  console.log('✗ explicit onboardingComplete flag should be honored');
}

console.log('\n── API health ──');
async function checkApi() {
  try {
    const res = await fetch('http://127.0.0.1:3011/health');
    if (res.ok) console.log('✓ plate API reachable on :3011');
    else {
      failed += 1;
      console.log(`✗ plate API health returned ${res.status}`);
    }
  } catch {
    console.log('○ plate API not running locally (skip)');
  }

  console.log(failed === 0 ? '\nAll checks passed.' : `\n${failed} check(s) failed.`);
  process.exit(failed === 0 ? 0 : 1);
}

void checkApi();
