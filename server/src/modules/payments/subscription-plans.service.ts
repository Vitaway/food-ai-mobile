import { BadRequestError, NotFoundError } from "routing-controllers";
import { AppDataSource } from "../../config/database";
import { SubscriptionPlan } from "./subscription-plan.entity";
import type { PlanDefinition } from "./plan-catalog";
import { PLAN_CATALOG } from "./plan-catalog";

const planRepo = () => AppDataSource.getRepository(SubscriptionPlan);

function toDefinition(row: SubscriptionPlan): PlanDefinition {
  return {
    code: row.code,
    label: row.label,
    amount: Number(row.amount),
    currency: (row.currency as "RWF") || "RWF",
    subscriptionType: row.subscriptionType,
    intervalDays: row.intervalDays,
    public: row.isPublic,
  };
}

export const subscriptionPlansService = {
  async ensureSeeded() {
    const count = await planRepo().count();
    if (count > 0) return;
    const rows = PLAN_CATALOG.map((p) =>
      planRepo().create({
        code: p.code,
        label: p.label,
        amount: String(p.amount),
        currency: p.currency,
        subscriptionType: p.subscriptionType,
        intervalDays: p.intervalDays,
        isPublic: p.public !== false,
        isActive: true,
      }),
    );
    await planRepo().save(rows);
  },

  async listPublic(): Promise<
    Array<{
      code: string;
      label: string;
      amount: number;
      currency: string;
      subscriptionType: string;
      intervalDays: number;
    }>
  > {
    await this.ensureSeeded();
    const rows = await planRepo().find({
      where: { isPublic: true, isActive: true },
      order: { intervalDays: "ASC", amount: "ASC" },
    });
    return rows.map((r) => ({
      code: r.code,
      label: r.label,
      amount: Number(r.amount),
      currency: r.currency,
      subscriptionType: r.subscriptionType,
      intervalDays: r.intervalDays,
    }));
  },

  async listAllAdmin() {
    await this.ensureSeeded();
    const rows = await planRepo().find({ order: { code: "ASC" } });
    return rows.map((r) => ({
      code: r.code,
      label: r.label,
      amount: Number(r.amount),
      currency: r.currency,
      subscriptionType: r.subscriptionType,
      intervalDays: r.intervalDays,
      isPublic: r.isPublic,
      isActive: r.isActive,
      updatedAt: r.updatedAt.toISOString(),
    }));
  },

  async getByCode(code: string): Promise<PlanDefinition | null> {
    await this.ensureSeeded();
    const row = await planRepo().findOne({ where: { code } });
    if (!row || !row.isActive) return null;
    return toDefinition(row);
  },

  async createPlan(input: {
    code: string;
    label: string;
    amount: number;
    currency?: string;
    subscriptionType: "individual" | "corporate" | "family";
    intervalDays: number;
    isPublic?: boolean;
    isActive?: boolean;
  }) {
    await this.ensureSeeded();
    const code = input.code.trim().toLowerCase().replace(/\s+/g, "_");
    if (!/^[a-z][a-z0-9_]{2,62}$/.test(code)) {
      throw new BadRequestError(
        "Plan code must be 3–63 chars: lowercase letters, numbers, underscores",
      );
    }
    const existing = await planRepo().findOne({ where: { code } });
    if (existing) throw new BadRequestError("A plan with this code already exists");
    if (!(input.amount > 0)) throw new BadRequestError("Amount must be greater than zero");
    if (!(input.intervalDays > 0)) throw new BadRequestError("intervalDays must be > 0");
    if (!input.label.trim()) throw new BadRequestError("Label is required");

    const row = planRepo().create({
      code,
      label: input.label.trim(),
      amount: String(Math.round(input.amount)),
      currency: (input.currency?.trim().toUpperCase() || "RWF").slice(0, 3),
      subscriptionType: input.subscriptionType,
      intervalDays: Math.round(input.intervalDays),
      isPublic: input.isPublic !== false,
      isActive: input.isActive !== false,
    });
    await planRepo().save(row);
    return {
      code: row.code,
      label: row.label,
      amount: Number(row.amount),
      currency: row.currency,
      subscriptionType: row.subscriptionType,
      intervalDays: row.intervalDays,
      isPublic: row.isPublic,
      isActive: row.isActive,
      updatedAt: row.updatedAt.toISOString(),
    };
  },

  async updatePlan(
    code: string,
    patch: {
      label?: string;
      amount?: number;
      intervalDays?: number;
      isPublic?: boolean;
      isActive?: boolean;
    },
  ) {
    await this.ensureSeeded();
    const row = await planRepo().findOne({ where: { code } });
    if (!row) throw new NotFoundError("Plan not found");
    if (patch.label != null) row.label = patch.label.trim();
    if (patch.amount != null) {
      if (!(patch.amount > 0)) throw new BadRequestError("Amount must be greater than zero");
      row.amount = String(Math.round(patch.amount));
    }
    if (patch.intervalDays != null) {
      if (!(patch.intervalDays > 0)) throw new BadRequestError("intervalDays must be > 0");
      row.intervalDays = Math.round(patch.intervalDays);
    }
    if (patch.isPublic != null) row.isPublic = patch.isPublic;
    if (patch.isActive != null) row.isActive = patch.isActive;
    await planRepo().save(row);
    return {
      code: row.code,
      label: row.label,
      amount: Number(row.amount),
      currency: row.currency,
      subscriptionType: row.subscriptionType,
      intervalDays: row.intervalDays,
      isPublic: row.isPublic,
      isActive: row.isActive,
      updatedAt: row.updatedAt.toISOString(),
    };
  },
};
