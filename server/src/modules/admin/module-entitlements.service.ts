import type { Request } from "express";
import { BadRequestError } from "routing-controllers";
import { AppDataSource } from "../../config/database";
import { CoachProfile } from "../coaches/coach-profile.entity";
import { Organization } from "../payments/organization.entity";
import { adminAuditService } from "./admin-audit.service";
import {
  DEFAULT_ORG_MODULES,
  MODULE_CATALOG,
  MODULE_KEYS,
  isModuleKey,
  type ModuleKey,
} from "./module-catalog";
import { OrganizationModuleEntitlement } from "./organization-module-entitlement.entity";

function normalizeOrgKey(value: string) {
  return value.trim();
}

function entitlementRepo() {
  return AppDataSource.getRepository(OrganizationModuleEntitlement);
}

async function listKnownOrganizations(): Promise<string[]> {
  const keys = new Set<string>();

  const profiles = await AppDataSource.getRepository(CoachProfile).find();
  for (const profile of profiles) {
    if (profile.organization?.trim()) keys.add(profile.organization.trim());
  }

  const orgs = await AppDataSource.getRepository(Organization).find();
  for (const org of orgs) {
    if (org.name?.trim()) keys.add(org.name.trim());
  }

  const existing = await entitlementRepo()
    .createQueryBuilder("e")
    .select("DISTINCT e.organization_key", "organizationKey")
    .getRawMany<{ organizationKey: string }>();
  for (const row of existing) {
    if (row.organizationKey?.trim()) keys.add(row.organizationKey.trim());
  }

  return [...keys].sort((a, b) => a.localeCompare(b));
}

async function rowsForOrganization(organizationKey: string) {
  return entitlementRepo()
    .createQueryBuilder("e")
    .where("LOWER(e.organization_key) = LOWER(:key)", { key: organizationKey })
    .getMany();
}

function modulesFromRows(rows: OrganizationModuleEntitlement[]): ModuleKey[] {
  const enabled = new Set(
    rows.filter((r) => r.enabled && isModuleKey(r.moduleKey)).map((r) => r.moduleKey as ModuleKey),
  );
  if (enabled.size === 0 && rows.length === 0) {
    return [...DEFAULT_ORG_MODULES];
  }
  return MODULE_KEYS.filter((key) => enabled.has(key));
}

export const moduleEntitlementsService = {
  catalog() {
    return MODULE_CATALOG;
  },

  async listAccounts() {
    const organizations = await listKnownOrganizations();
    const accounts = [];
    for (const organizationKey of organizations) {
      const rows = await rowsForOrganization(organizationKey);
      const modules = modulesFromRows(rows);
      accounts.push({
        organizationKey,
        modules,
        moduleLabels: MODULE_CATALOG.filter((m) => modules.includes(m.key)).map((m) => m.name),
        stored: rows.length > 0,
      });
    }
    return {
      catalog: MODULE_CATALOG,
      accounts,
    };
  },

  async getOrganization(organizationKeyRaw: string) {
    const organizationKey = normalizeOrgKey(organizationKeyRaw);
    if (!organizationKey) throw new BadRequestError("Organization is required");
    const rows = await rowsForOrganization(organizationKey);
    const modules = modulesFromRows(rows);
    return {
      organizationKey,
      modules,
      moduleLabels: MODULE_CATALOG.filter((m) => modules.includes(m.key)).map((m) => m.name),
      stored: rows.length > 0,
      catalog: MODULE_CATALOG,
    };
  },

  async setOrganizationModules(
    adminUserId: string,
    organizationKeyRaw: string,
    moduleKeys: string[],
    req?: Request,
  ) {
    const organizationKey = normalizeOrgKey(organizationKeyRaw);
    if (!organizationKey) throw new BadRequestError("Organization is required");

    const unique = [...new Set(moduleKeys.map((k) => k.trim()).filter(Boolean))];
    for (const key of unique) {
      if (!isModuleKey(key)) {
        throw new BadRequestError(`Unknown module: ${key}`);
      }
    }
    const enabledSet = new Set(unique as ModuleKey[]);

    const repo = entitlementRepo();
    const existing = await rowsForOrganization(organizationKey);

    for (const key of MODULE_KEYS) {
      const row = existing.find((r) => r.moduleKey === key);
      const enabled = enabledSet.has(key);
      if (row) {
        row.enabled = enabled;
        row.organizationKey = organizationKey;
        await repo.save(row);
      } else {
        await repo.save(
          repo.create({
            organizationKey,
            moduleKey: key,
            enabled,
          }),
        );
      }
    }

    await adminAuditService.log(adminUserId, "module_entitlements.update", {
      targetType: "organization",
      targetId: organizationKey,
      meta: { modules: unique },
      req,
    });

    return this.getOrganization(organizationKey);
  },

  async hasModule(organizationKeyRaw: string | null | undefined, moduleKey: ModuleKey) {
    if (!organizationKeyRaw?.trim()) {
      return DEFAULT_ORG_MODULES.includes(moduleKey);
    }
    const rows = await rowsForOrganization(organizationKeyRaw.trim());
    if (rows.length === 0) {
      return DEFAULT_ORG_MODULES.includes(moduleKey);
    }
    return rows.some((r) => r.moduleKey === moduleKey && r.enabled);
  },

  async ensureAccount(adminUserId: string, organizationKeyRaw: string, req?: Request) {
    const organizationKey = normalizeOrgKey(organizationKeyRaw);
    if (!organizationKey) throw new BadRequestError("Organization is required");
    const existing = await rowsForOrganization(organizationKey);
    if (existing.length > 0) {
      return this.getOrganization(organizationKey);
    }
    await this.setOrganizationModules(adminUserId, organizationKey, [...DEFAULT_ORG_MODULES], req);
    return this.getOrganization(organizationKey);
  },
};
