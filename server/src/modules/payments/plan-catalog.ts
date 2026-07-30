export type PlanDefinition = {
  code: string;
  label: string;
  amount: number;
  currency: "RWF";
  subscriptionType: "individual" | "corporate" | "family";
  intervalDays: number;
  /** When false, plan is checkout-valid but hidden from consumer plan list. */
  public?: boolean;
};

export const PLAN_CATALOG: PlanDefinition[] = [
  {
    code: "individual_weekly",
    label: "Weekly",
    amount: 5000,
    currency: "RWF",
    subscriptionType: "individual",
    intervalDays: 7,
    public: true,
  },
  {
    code: "individual_monthly",
    label: "Monthly",
    amount: 15000,
    currency: "RWF",
    subscriptionType: "individual",
    intervalDays: 30,
    public: true,
  },
  {
    code: "family_monthly",
    label: "Family",
    amount: 35000,
    currency: "RWF",
    subscriptionType: "family",
    intervalDays: 30,
    public: true,
  },
  // Kept for existing corporate subscriptions / admin — not offered in consumer checkout.
  {
    code: "corporate_monthly",
    label: "Corporate",
    amount: 50000,
    currency: "RWF",
    subscriptionType: "corporate",
    intervalDays: 30,
    public: false,
  },
];

export function getPlanByCode(planCode: string): PlanDefinition | null {
  return PLAN_CATALOG.find((p) => p.code === planCode) ?? null;
}

/** Consumer-facing plans: Weekly, Monthly, Family only (no Corporate). */
export function listPublicPlans() {
  return PLAN_CATALOG.filter((p) => p.public !== false).map(
    ({ code, label, amount, currency, subscriptionType, intervalDays }) => ({
      code,
      label,
      amount,
      currency,
      subscriptionType,
      intervalDays,
    }),
  );
}
