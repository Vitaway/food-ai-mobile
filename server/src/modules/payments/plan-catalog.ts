export type PlanDefinition = {
  code: string;
  label: string;
  amount: number;
  currency: "RWF";
  subscriptionType: "individual" | "corporate" | "family";
  intervalDays: number;
};

export const PLAN_CATALOG: PlanDefinition[] = [
  {
    code: "individual_monthly",
    label: "Individual",
    amount: 15000,
    currency: "RWF",
    subscriptionType: "individual",
    intervalDays: 30,
  },
  {
    code: "corporate_monthly",
    label: "Corporate",
    amount: 50000,
    currency: "RWF",
    subscriptionType: "corporate",
    intervalDays: 30,
  },
  {
    code: "family_monthly",
    label: "Family",
    amount: 35000,
    currency: "RWF",
    subscriptionType: "family",
    intervalDays: 30,
  },
];

export function getPlanByCode(planCode: string): PlanDefinition | null {
  return PLAN_CATALOG.find((p) => p.code === planCode) ?? null;
}

export function listPublicPlans() {
  return PLAN_CATALOG.map(({ code, label, amount, currency, subscriptionType }) => ({
    code,
    label,
    amount,
    currency,
    subscriptionType,
  }));
}
