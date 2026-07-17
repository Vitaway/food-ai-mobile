export const MODULE_KEYS = [
  "tracking",
  "coaching",
  "clinical",
  "claims",
  "corporate_reporting",
  "fulfillment",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export type ModuleDefinition = {
  key: ModuleKey;
  name: string;
  description: string;
  defaultAudience: string;
};

/** Feature bundles an account can be entitled to use. */
export const MODULE_CATALOG: ModuleDefinition[] = [
  {
    key: "tracking",
    name: "Tracking",
    description: "Photo meal logging, Health Score, patient app",
    defaultAudience: "Every patient account",
  },
  {
    key: "coaching",
    name: "Coaching",
    description: "Coach messaging, meal plan builder, review queue",
    defaultAudience: "Every patient account",
  },
  {
    key: "clinical",
    name: "Clinical",
    description: "Diagnosis-linked care plans, clinician sign-off, special nutrition flags",
    defaultAudience: "Only clinician/insurer-referred patients",
  },
  {
    key: "claims",
    name: "Claims & Reporting",
    description: "Claims list, approval tracking, reimbursement export",
    defaultAudience: "Only insurer accounts",
  },
  {
    key: "corporate_reporting",
    name: "Corporate Reporting",
    description: "Aggregate engagement/outcomes dashboards",
    defaultAudience: "Only employer/gym accounts",
  },
  {
    key: "fulfillment",
    name: "Fulfillment",
    description: "Order queue, delivery schedule, patient intake-on-behalf-of",
    defaultAudience: "Only kitchen/fulfillment partners",
  },
];

/** Baseline modules for a typical coaching org when none are stored yet. */
export const DEFAULT_ORG_MODULES: ModuleKey[] = ["tracking", "coaching"];

export function isModuleKey(value: string): value is ModuleKey {
  return (MODULE_KEYS as readonly string[]).includes(value);
}
