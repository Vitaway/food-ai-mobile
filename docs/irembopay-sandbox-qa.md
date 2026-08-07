# IremboPay QA checklist

**Audience:** Hirwa + eng  
**Docs:** [IremboPay API](https://irembopay.gitbook.io/irembopay-api-docs)  
**Flow:** Create Invoice (`IREMBO_SERVICE_FEE_CODE` + plan `unitAmount`) → open `paymentLinkUrl` → webhook `PAID` → subscription `active`

## Portal setup (once)

1. Log into IremboPay portal (sandbox or production).
2. Create a **payment account** (RWF); copy identifier → `IREMBO_PAYOUT_ACCOUNT`.
3. Create / note the **service fee product** → `IREMBO_SERVICE_FEE_CODE` (used for all subscription tiers; amount comes from admin plan pricing).
4. Set **callback URL** to:  
   `https://vitaway.nsengi.space/api/v1/payments/irembo/webhook`  
   (or your tunnel URL while testing locally).
5. Copy **secret key** → `IREMBO_PAY_SECRET_KEY` (and optionally `IREMBO_PAY_PUBLIC_KEY`).
6. Set `IREMBO_PAY_BASE_URL` to the API host ending in `/payments`.

## App env (server)

```env
IREMBO_PAY_BASE_URL=https://api.sandbox.irembopay.com/payments
IREMBO_PAY_SECRET_KEY=...
IREMBO_PAY_PUBLIC_KEY=...
IREMBO_PAYOUT_ACCOUNT=TST-RWF
IREMBO_SERVICE_FEE_CODE=PC-...
IREMBO_SHIPPING_PRODUCT_CODE=
```

Production example:

```env
IREMBO_PAY_BASE_URL=https://api.irembopay.com/payments
IREMBO_PAYOUT_ACCOUNT=VITAWAY_HEALTH_RWF
IREMBO_SERVICE_FEE_CODE=PC-8ccbd6ab27
ENFORCE_SUBSCRIPTIONS=true
```

Restart API after changing env. Plan prices are edited in **Admin → Payments** (DB `subscription_plans`).

## Test channels (sandbox only; no real money)

From [Irembo testing docs](https://irembopay.gitbook.io/irembopay-api-docs/irembopay-api-docs-v2/integration/accepting-payments-on-your-website/interactive-blocks.md):

| Channel | Success | Fail |
|---|---|---|
| Visa | `4242 4242 4242 4242` / any future expiry / CVV `123` |; |
| Mastercard | `5555 5555 5555 4444` | `5198 9602 2985 7244` |
| Amex | `3782 822463 10005` / CVV `1234` |; |
| MTN MoMo | `0781234567` | `0780123456` |
| Airtel | `0731234567` | `0730123456` |

## E2E checklist

- [ ] **Weekly**; checkout opens Irembo page; success → app Refresh shows `active`, `planCode=individual_weekly`
- [ ] **Monthly**; same → `individual_monthly`
- [ ] **Family**; same → `family_monthly`; payer appears in family members
- [ ] **Failed** payment; tx `failed`; if user was already `active`, status stays `active`
- [ ] Checkout does **not** grant access before `PAID` (status stays non-active / `past_due`)
- [ ] Without active sub, meal log / water / reports return **403** and mobile opens Subscription
- [ ] **Webhook signature**; forged callback without valid `irembopay-signature` returns 403
- [ ] **Refresh status**; after paying, `GET /payments/checkout/:externalRef/status` reconciles if webhook is delayed
- [ ] Corporate plan **not** listed in mobile subscription UI
- [ ] Admin can change plan amounts; next checkout uses new `unitAmount`

## Production cutover

1. Confirm production keys / payout / service fee code on VPS `.env` only (never commit).
2. Confirm callback URL is the public HTTPS API.
3. Run one live smoke test per tier before launch announcement.
4. Rotate any secret that was shared outside the VPS.
