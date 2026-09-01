# Module 2 — BHRP (Rental Platform) · Posting Actors: Leasing Agent & Landlord

> See `00-overview-and-conventions.md` for global rules, and **`07-auth-and-roles.md`'s "Posting Capability Split" section is required reading before this file** — it explains why this single BHRP module serves both roles with meaningfully different behavior, rather than `01-bhms-landlord.md` having its own separate posting screens.
>
> **Note on the actor name:** `leasing_agent` is a value in `UserRole` (`leasing_agent | tenant | employee | landlord | admin`) — this is the role every user starts with on registration (see `07-auth-and-roles.md` UC-AUTH-01). A `landlord` is a `User` who additionally owns at least one `BoardingHouse`; they retain full leasing-agent posting capability plus the room-linking upgrade described below. Every `postedBy` reference is simply a `User.id` — there is no separate table per role.

---

### UC-P-01 — Publish Rental Listing
**Tier:** Free (with paid add-on credits) · **Models:** `Post`, `PostImage`, `PostPurchase`, `SubscriptionPlan`, `UserSubscription`, `BoardingHouse`, `Room`

**Step 1 — determine landlord-or-not (drives both the room-linking rule and the quota formula):**
```sql
SELECT EXISTS(SELECT 1 FROM boarding_houses WHERE owner_id = :userId) AS is_landlord;
```
This single check governs everything below — do not branch on `User.role` directly (a user's `role` might still read `'tenant'` or `'employee'` even after they've created a `BoardingHouse` and bumped to `'landlord'` is only guaranteed *eventually* consistent with this ownership fact per the role-bump rule in `07-auth-and-roles.md`; the ownership query itself is always the ground truth).

**Step 2 — room-linking rule (validate before quota, since a bad `roomId` should fail fast):**
- **`is_landlord = false` (pure leasing agent):** `roomId` **must be `NULL`**. If the request includes a `roomId`, reject with a clear error — leasing agents publish general listings only (title, content, price, images, free-text area/description), never tied to a specific existing `Room` record.
- **`is_landlord = true`:** `roomId` is optional. If provided, validate `Room.boardingHouse.ownerId = :userId` — a landlord may only link rooms they actually own, never another landlord's room.

**Step 3 — quota check:**
```sql
-- a) free posts used today (same query regardless of role)
SELECT COUNT(*) FROM posts
WHERE posted_by = :userId AND source_type = 'free_quote' AND created_at::date = CURRENT_DATE;

-- b) total free quota for today — formula depends on is_landlord from Step 1
```
- **Leasing agent (`is_landlord = false`):** total free quota = **flat `BASE_DAILY_FREE_POST_QUOTA` constant = 3**. No `SubscriptionPlan`/`UserSubscription` lookup at all — the property-management plan concept does not apply to them, not even an implicit `Free` tier. Do not default them into `SubscriptionPlan(planName='free')`; that row is for landlords who haven't upgraded, a completely different concept.
- **Landlord (`is_landlord = true`):** total free quota = `BASE_DAILY_FREE_POST_QUOTA` (3) **+** the bonus from their current active property-management plan:
  ```sql
  SELECT COALESCE(sp.daily_post_quote, 0) AS bonus
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.plan_name = us.plan_name
  WHERE us.user_id = :userId AND us.status = 'active'
  ORDER BY us.start_date DESC LIMIT 1;
  -- no active row -> bonus = 0 (implicit Free-tier landlord, same "no subscription row = Free" convention as UC-L-02)
  ```
  So: no active subscription (Free-tier landlord) → 3 + 0 = **3/day**. Active `plus` → 3 + 5 = **8/day**. Active `pro` → 3 + 10 = **13/day**.

  **Schema meaning change:** `SubscriptionPlan.dailyPostQuote` is no longer "the total daily quota for this plan" — it is now the **bonus** amount added on top of the flat base. Reseed the table: `free.dailyPostQuote = 0`, `plus.dailyPostQuote = 5`, `pro.dailyPostQuote = 10`. If your copy of `schema.prisma`/seed data still treats this field as a total, update the seed values — the field itself doesn't need a schema change, just a data/semantics correction.

- If `(a) < total_free_quota`: allowed, `sourceType='free_quote'`, `postPurchaseId=NULL`.
- Else, check available purchased credit — **identical mechanism for both roles, completely independent of the property-management plan**: `PostPurchase WHERE buyerId=:userId AND status='paid' AND COUNT(Post WHERE postPurchaseId = this.id) < quantityPurchase`, oldest `activatedAt` first (FIFO). Used quantity is computed via `COUNT(Post)`, not a stored `quantityUsed` field (confirmed design choice, not a gap).
- If found: `sourceType='purchased'`, `postPurchaseId=<that row's id>`.
- If neither: reject with a clear "out of posting quota, buy more credits" error.

**Step 4 — create the post:**
1. Input: `roomId` (per Step 2's rule), `title`, `content`, `depositAmount`, `imageUrls[]`.
2. Insert `Post(postedBy, roomId, title, content, depositAmount, sourceType, postPurchaseId, status='draft' or 'posted')`, then `PostImage(postId, url)` rows.
3. If the poster is a landlord and used UC-L-12's AI draft, prefill `content`/images from the returned `AiMessage` — Steps 1–3 above still apply unconditionally, AI-assisted drafting never bypasses the room-linking rule or the quota check.

**Note on `PostStatus`:** the live enum is `draft | posted | hidden` — richer than a simple active/closed toggle. A listing can be saved as `draft` before publishing, and `hidden` covers both a poster-initiated pause and the auto-close triggered when a platform deposit converts to a contract (`01-bhms-landlord.md` UC-L-04 Flow A, step 7 — landlord-only, since only a landlord's linked-room post can ever receive a platform deposit in the first place). Implement the auto-close as `status → hidden`, not a deletion.

---

### UC-P-02 — Post Reach Analytics
**Tier:** Paid add-on · **Models:** `PostReach`

Query `Post WHERE postedBy=:userId`, joined `PostReach` for aggregate view counts (`COUNT(PostReach) GROUP BY postId`). Drill-down for a single post: same query filtered to one `postId`, broken out by day (`GROUP BY date_trunc('day', viewedAt)`) for a trend chart.

**Gating note — flag to product before implementing:** the original source use-case doc lists this as a paid capability of the leasing-agent-level role specifically ("trả phí"), independent of the landlord property-management tiers. Since leasing agents now have **no `SubscriptionPlan` at all** (per the split above), gating this behind `SubscriptionPlan='pro'` (as an earlier draft of this spec did) is inconsistent — that would make it landlord-Pro-only, silently cutting leasing agents out of a feature meant for them too. There is currently no schema concept for "a standalone paid unlock, independent of both `PostPurchase` (post credits) and `SubscriptionPlan` (property management tier)". Before implementing, confirm with product whether this should be: **(a)** bundled free with any `PostPurchase` (buying post credits also unlocks analytics), **(b)** its own separate one-time/recurring purchase (needs a new model, e.g. `AnalyticsAddon`), or **(c)** actually intended to be landlord-Pro-only after all, in which case the original use-case doc's "trả phí" note for the Poster/Leasing Agent role should be corrected instead.