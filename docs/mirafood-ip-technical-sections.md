# MiraFood — IP registration technical sections (draft)

**Prepared:** 31 July 2026  
**For:** MiraFood IP application (technical input)  
**Status:** Draft for internal review before filing

---

## 1. Technical description of the invention / system

MiraFood is a clinical nutrition platform that combines:

1. **Mobile meal capture** (camera / text) for patients.
2. **AI-assisted food recognition and portion estimation** to propose meal composition.
3. **Human coach review** before nutrition results are released to the patient.
4. **A Rwanda / East Africa–oriented nutrition database** (TFCT-aligned composition per 100 g, bilingual naming where available).
5. **Coach, admin, and reporting tools** for caseload management, assignments, and downloadable nutrition reports.
6. **Subscription billing** (weekly, monthly, family) via a payment provider integration.

The inventive contribution is the **end-to-end clinical workflow**: AI proposal → coach verification against a local food composition database → patient-facing approved nutrition profile, with server-side access control separating patient, coach, and payer data.

---

## 2. System architecture (high level)

```
[MiraFood Mobile App]          [Vitaway Web — Coach/Admin]
        |                                    |
        | HTTPS / JWT                        | HTTPS / JWT
        v                                    v
              [MiraFood API Server]
                 |         |         |
         Postgres DB    File store   Payment provider
         (users, meals,  (meal       (checkout +
          nutrition DB,   photos +    webhooks)
          reviews,        thumbnails)
          subscriptions)
                 |
         [Optional AI vision / LLM providers]
```

**Layers**

| Layer | Role |
|---|---|
| Mobile (Expo / React Native) | Meal logging, dashboard, subscription, chat |
| Web (React) | Coach review queue, nutrition DB, admin assignment, reports |
| API (Node / Express / TypeORM) | Auth, entitlements, meal lifecycle, nutrition DB, payments |
| Data | PostgreSQL (JSON composition + relational assignments); disk/object uploads for images |

---

## 3. Food recognition pipeline

1. Patient captures a meal photo (and optional text / plate diameter).
2. Client compresses the image and uploads it with the meal submission.
3. Server stores a **full-size** and **thumbnail** image.
4. Vision / analysis service returns proposed food items, weights, and nutrition estimates.
5. Meal enters **`in_review`**; patient sees limited provisional status until coach action.
6. Coach may request AI assist, match items to the Nutrition Database, edit weights, and approve or reject.
7. On approve, the **coach-confirmed** item list and totals become the patient-visible record.

---

## 4. Nutrition estimation

- Primary composition source: **Nutrition Database** rows with per-100 g TFCT nutrient keys (energy, macros, vitamins, minerals, amino acids where available).
- Portion scaling: `(weight_g / 100) × per-100g values`.
- Meal totals: sum across confirmed items.
- Composite dishes (Recipe module): raw ingredient weights → total nutrients → divide by **cooked yield weight** → multiply by serving weight for per-serving clinical values.

---

## 5. Meal analysis & personalised recommendations

- Health flags / messages and “petals” scoring derived from approved meal nutrition and patient profile targets.
- Coach notes and clinical assessment panels support personalised guidance.
- Smart alerts surface caseload risks (e.g. review SLA, allergies) for coaches — cleared after review so approved meals do not retain stale urgency warnings.

---

## 6. Coach review workflow

1. Shared team queue of `in_review` meals (optional cohort filter).
2. Coach picks a meal (exclusive pick), edits items / DB matches, optionally runs AI assist.
3. Approve or reject with note; patient notification on outcome.
4. Admin can **assign / reassign** coaches to clients; caseload updates server-side and appears on the coach dashboard.
5. Past reviews retained for audit / training notes.

---

## 7. Datasets required

| Dataset | Use |
|---|---|
| TFCT / local food composition tables | Ground-truth per-100 g nutrients |
| Packaged / barcode foods | Retail items |
| Recipe / traditional dish composites | Multi-ingredient cooked dishes (e.g. Isombe) |
| De-identified meal photos + coach corrections | Model improvement / QA |
| Allergen vocabularies | Safety matching against patient allergy lists |

---

## 8. Model training strategy (roadmap)

1. **Now:** Third-party / hosted vision + LLM for proposals; coach corrections are source of truth.
2. **Near term:** Curate correction pairs (AI proposal vs coach-approved items) for evaluation metrics.
3. **Later:** Fine-tune or train local recognisers for East African dishes; calibrate portion estimation against plated references.
4. **Governance:** No training on identifiable clinical notes without consent/policy; prefer de-identified images and structured labels.

---

## 9. Phases and timeline (technical)

| Phase | Focus | Timing note |
|---|---|---|
| Launch baseline | Secure API, coach review, TFCT DB, payments, store submits | 3 August 2026 target |
| Recipe engine | Composite dishes + cooked yield | First post-launch update if not signed off by 1 Aug |
| Image / perf | Thumbnails, cache, feed load targets | In flight for launch |
| Model iteration | Correction dataset + evaluation harness | Post-launch |
| Full security audit | Pen test, dependency sweep | After launch |

---

## 10. Distinctive technical features (for form checkboxes / narrative)

- Bilingual (EN / Kinyarwanda) food naming support in the nutrition database.
- Coach-in-the-loop release of nutrition results (clinical safety).
- Server-side caseload and payer isolation (not client-only filtering).
- Local food composition alignment (TFCT keys) rather than generic Western-only databases alone.
- Family subscription membership managed server-side.

---

## 11. Open items for filing counsel / product owner

- Exact applicant legal name, inventors list, and priority date.
- Whether Recipe/Dish module is claimed as of the filing date or as a planned embodiment.
- Confirmation of any third-party model licenses that must be disclosed.

---

*End of technical draft — replace bracketed product names/URLs if the filing uses different trade dress.*
