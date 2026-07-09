import type { UserRole } from "./auth.middleware";

export type Permission =
  | "admin:metrics"
  | "admin:users"
  | "admin:payments"
  | "admin:reports"
  | "admin:referrals"
  | "admin:system"
  | "coach:queue"
  | "coach:clients"
  | "coach:reports"
  | "coach:messages"
  | "nutrition-db:read"
  | "nutrition-db:write"
  | "consumer:meals"
  | "consumer:reports";

const ROLE_PERMISSIONS: Record<string, Permission[] | "*"> = {
  admin: "*",
  super_admin: "*",
  organization_admin: [
    "admin:metrics",
    "admin:users",
    "admin:reports",
    "admin:referrals",
    "coach:clients",
    "coach:reports",
    "nutrition-db:read",
  ],
  coach: [
    "coach:queue",
    "coach:clients",
    "coach:reports",
    "coach:messages",
    "nutrition-db:read",
    "nutrition-db:write",
  ],
  nutrition_coach: [
    "coach:queue",
    "coach:clients",
    "coach:reports",
    "coach:messages",
    "nutrition-db:read",
    "nutrition-db:write",
  ],
  data_entry_staff: ["nutrition-db:read", "nutrition-db:write"],
  consumer: ["consumer:meals", "consumer:reports", "nutrition-db:read"],
};

export function roleHasPermission(role: UserRole | string, permission: Permission): boolean {
  const grants = ROLE_PERMISSIONS[role];
  if (!grants) return false;
  if (grants === "*") return true;
  return grants.includes(permission);
}

export function userHasPermission(role: UserRole | string, permission: Permission): boolean {
  if (roleHasPermission(role, permission)) return true;
  if (role === "admin") return true;
  if (role === "coach" && permission.startsWith("nutrition-db:")) return true;
  return false;
}
