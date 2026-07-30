# Security baseline confirmation (Task 8)

**Date:** 31 July 2026  
**Scope:** Production minimum for 3 August launch — not a full security audit.

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | Passwords hashed with bcrypt or Argon2 (no plain text, MD5, or SHA-1) | **Confirmed** | Consumer/staff passwords hashed with `bcryptjs` (cost factor 10) in `server/src/modules/auth/auth.service.ts`, admin/coach password-change flows. No MD5/SHA-1 password storage found. |
| 2 | All API traffic over HTTPS | **Confirmed (ops)** | Production terminates TLS at nginx/certbot per `server/DEPLOY.md`. Public API bases use `https://` (`vitaway.nsengi.space`, `mirafood.vitaway.org`). App serves HTTP only behind the TLS terminator — clients never talk cleartext to production. |
| 3 | Authentication on every endpoint that returns patient/client data | **Confirmed** | JWT + session checks via `server/src/middlewares/auth.middleware.ts` (`@Authorized`, `createAuthorizationChecker`). Consumer meal/profile routes require the owning user; coach routes use `ensureCoachCanAccessClient` / caseload scoping; uploads under `/uploads` require `requireUploadsAuth()`. |
| 4 | No secrets, keys, or credentials in the repository | **Confirmed** | `.env` is gitignored. Only `.env.example` is tracked (placeholder values, not production secrets). Runtime secrets (`JWT_SECRET`, DB, IremboPay, SMTP, AI keys) load from environment. |
| 5 | Payer and clinical data isolated server-side (not filtered only in the client) | **Confirmed** | Coach caseload/queue scoping in `coach-scope.util.ts` / `coach-meals.service.ts`. Org-admin checks in admin patient services. Consumer DTOs strip provisional nutrition until coach approval (`mealToConsumerDto`). Payment/subscription records are owned and queried server-side by `userId` / org membership — clients cannot request another user’s payer rows by ID without authz failure. |

## Residual notes (post-launch hardening)

- Rotate any default/dev `JWT_SECRET` before production cutover; confirm `MFA_REQUIRED_FOR_STAFF` for coach/admin where policy requires it.
- Full penetration test and dependency CVE sweep scheduled after launch.
- Corporate plans remain in catalog for legacy admin flows but are hidden from consumer self-serve checkout.

**Sign-off:** Engineering confirms the five production-minimum points above are met as of this document.
