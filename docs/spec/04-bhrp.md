# MODULE 2 — BHRP: Boarding House Rental Platform

**Module**: Boarding House Rental Platform (BHRP)
**Actors**: Poster / Landlord (Người đăng), Platform User / Prospective Tenant (Người thuê trọ)
**Global rules**: See `docs/spec/00-global-conventions.md`

---

## Actor: Poster / Landlord (Người đăng)

### UC-P-01 — Publish Rental Listing
**Tier:** Free

**Tables:** `POST`, `POST_IMAGE`, `POST_PURCHASE`

**Flow:**
1. **Quota check first:**
   ```sql
   -- a) free posts used today
   SELECT COUNT(*) FROM post
   WHERE posted_by = :userId AND source_type = 'free_quota' AND created_at::date = CURRENT_DATE;
   -- b) plan's daily quota
   SELECT sp.daily_post_quota FROM subscription_plan sp
   WHERE sp.name = COALESCE(
     (SELECT plan FROM user_subscription WHERE user_id=:userId AND status='active' ORDER BY start_date DESC LIMIT 1),
     'Free'
   );
   ```
   - If (a) < (b): allowed → `source_type='free_quota'`, `post_purchase_id=NULL`.
   - Else check `POST_PURCHASE WHERE user_id=:userId AND status='paid' AND quantity_used < quantity_purchased` (oldest `activated_at` first — FIFO): if found → `source_type='purchased'`, increment `quantity_used`.
   - Else: reject with clear error `out_of_posting_quota` — do not silently fail.
2. Input: `room_id` (nullable), `content`, `deposit_amount`, `image_urls[]`. If Landlord provides `room_id`, validate `ROOM.boarding_house_id` owner matches poster.
3. Insert `POST(room_id, posted_by, content, deposit_amount, source_type, post_purchase_id, status='active')`, then `POST_IMAGE` rows.
4. If landlord used UC-L-12 AI draft, prefill `content`/images from `AI_MESSAGE` output — still run quota check, AI drafting does not bypass quota. **`POST` is NOT created until landlord explicitly publishes.**

### UC-P-02 — Poster Analytics Dashboard
**Tier:** Pro

Query `POST WHERE posted_by=:userId`, joined `POST_REACH` for aggregate view counts. Drill-down = same query filtered to one `post_id`, with `POST_REACH` broken out by day for a trend chart.

---

## Actor: Platform User / Prospective Tenant (Người thuê trọ)

### UC-PU-01 — Browse & Filter Listings
**Tier:** Free · No auth required

Standard filtered query on `POST WHERE status='active'`, joined `ROOM` for location/price/services filters. No `user_id` context needed — this endpoint must be on the **public route group (no auth guard)**.

### UC-PU-02 — View Poster Profile
**Tier:** Free · No auth required

Public subset of `USER`: `avatar_url, full_name, status, created_at, COUNT(POST WHERE posted_by=user.id)`.

**Never expose `phone`/`email`** unless the viewer is authenticated and has an active `CONVERSATION` with this poster. Enforce this privacy boundary explicitly — do not just "forget" to select those columns.

### UC-PU-03 — Save / Bookmark Listings
**Tier:** Free (requires auth)

`SAVED_POST(user_id, post_id)` insert/delete, `@@unique([userId, postId])` — idempotent toggle, not accumulate.

### UC-PU-04 — Direct Online Deposit
**Tier:** Free · **Tech:** Payment Gateway

**This is the "platform deposit" flow.**

**Flow:**
1. User views a `POST`, clicks deposit, confirms `amount` (defaults to `POST.deposit_amount`).
2. Backend creates `DEPOSIT(boarding_house_id=<from POST.room_id>, room_id=<POST.room_id>, contract_id=NULL, post_id=<post>, type='platform', amount, status='pending', recorded_manually=false)`.
3. Backend creates `PAYMENT(deposit_id=<new deposit>, payer_id=<user>, type='charge', status='pending', amount, method, qr_code_url or gateway redirect)`.
4. Gateway callback on success → `PAYMENT.status='success'`, `DEPOSIT.status='paid'` (single `$transaction`).
5. Alert landlord: `NOTIFICATION(sender_id=NULL, receiver_id=<POST.posted_by>, type='deposit_received')`.
6. **Auto-refund job:** scheduled job scans `DEPOSIT WHERE type='platform' AND status='paid' AND contract_id IS NULL AND created_at < NOW() - interval 'X days'` (X = env var `PLATFORM_DEPOSIT_HOLD_DAYS`, default: 7).
   - For each: call payment gateway refund API using original `PAYMENT.transaction_ref`.
   - On success: insert `PAYMENT(type='refund', original_payment_id=<charge>, deposit_id=<same>, amount=<same>, status='success')` + set `DEPOSIT.status='refunded'`.
   - This must run before UC-L-04b can be called on a stale deposit (guard: reject if `DEPOSIT.status != 'paid'`).

### UC-PU-05 — Initiate Direct Chat
**Tier:** Free · Must share infra with UC-L-11

Directly reuses `CONVERSATION`/`MESSAGE` — see UC-L-11 flow. **No separate implementation.**
