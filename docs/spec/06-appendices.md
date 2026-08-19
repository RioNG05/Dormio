# Appendices

---

## Appendix A — Media Storage Reference

Per design decision (real FK, not polymorphic):

- **Single-image fields** (direct field on owning table): `USER.avatar_url`, `CONTRACT.id_card_front_url`, `CONTRACT.id_card_back_url`, `METER_READING.image_url`.
- **Multi-image** (dedicated join tables with real FK): `POST_IMAGE.post_id`, `MESSAGE_ATTACHMENT.message_id`.

**Upload flow for all:**
1. Client requests a signed upload URL from backend.
2. Client uploads directly to cloud storage (Cloudinary / S3).
3. Backend receives the resulting URL and writes it to the relevant field/row.

**ID card images** (`CONTRACT.id_card_front_url` / `id_card_back_url`):
- Must be stored in a **private bucket**.
- Never served as public URLs.
- Always served via short-lived signed URLs generated at request time.

---

## Appendix B — Payment Type Reference

`PAYMENT` has exactly **4 mutually-exclusive nullable target FKs**:
- `invoice_id`
- `deposit_id`
- `post_purchase_id`
- `subscription_id`

Enforced by a `CHECK` constraint (exactly one non-null).

`type` distinguishes `CHARGE` vs `REFUND`. `original_payment_id` self-references the charge a refund is reversing.

`receipt_number` is only populated (and required, for tax purposes) when `post_purchase_id` or `subscription_id` is set — these are the two transaction types where money is actual platform revenue rather than a pass-through (deposits) or handled by the `INVOICE` billing cycle (monthly rent).

---

## Appendix C — Known Gaps (resolve before implementing)

| Gap | Required for | Action |
|---|---|---|
| `SUBSCRIPTION_PLAN.max_rooms` missing | UC-L-02 room count limit | Add column if enforcing room limit |
| `USER.must_change_password` | UC-L-19 staff onboarding | ✅ Already in current schema |
| `GRIEVANCE` table missing | UC-T-07, UC-A-04 | Add via migration before implementing |
| `MASS_NOTIFICATION_JOB` table missing | UC-A-05 | Add via migration before implementing |
| Platform deposit hold period unspecified | UC-PU-04 auto-refund | Treat as env var `PLATFORM_DEPOSIT_HOLD_DAYS` (default: 7) |
